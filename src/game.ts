// import THREE from 'three'

console.clear()

function rand (from: number, to: number) {
  return Math.random() * (to - from) + from
}

new class Game {
  sceneWidth = window.innerWidth
  sceneHeight = window.innerHeight

  readonly camera = (() => {
    const camera = new THREE.PerspectiveCamera(60, this.sceneWidth / this.sceneHeight, 0.1, 1000)
    camera.position.setZ(6.5).setY(2.5)
    return camera
  })()

  readonly scene = (() => {
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf0fff0, 0.14)
    return scene
  })()

  readonly renderer = (() => {
    // renderer with transparent backdrop
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setClearColor(0xfffafa, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(this.sceneWidth, this.sceneHeight)
    document.body.appendChild(renderer.domElement)
    return renderer
  })()

  readonly scoreText = (() => {
    const scoreText = document.createElement('div')
    scoreText.style.position = 'absolute'
    scoreText.innerHTML = '0'
    scoreText.style.top = 50 + 'px'
    scoreText.style.left = 10 + 'px'
    document.body.appendChild(scoreText)
    return scoreText
  })()

  readonly heroBaseY = 1.8
  currentLane = 0
  heroSphere = (() => {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2, 1),
      new THREE.MeshStandardMaterial({ color: 0xe5f2f2 ,flatShading: true }),
    )
    mesh.receiveShadow = true
    mesh.castShadow = true
    mesh.position.y = this.heroBaseY
    mesh.position.z = 4.8
    mesh.position.x = this.currentLane
    this.scene.add(mesh)
    return mesh
  })()

  readonly particles = (() => {
    const geometry = new THREE.Geometry()
    for (let i = 0; i < 20; i++) {
      geometry.vertices.push(new THREE.Vector3())
    }
    const material = new THREE.PointsMaterial({
      color: 0xfffafa,
      size: 0.2,
    })
    const particles = new THREE.Points(geometry, material)
    particles.visible = false
    this.scene.add(particles)
    return particles
  })()

  rollingGroundSphere!: THREE.Mesh
  readonly worldRadius = 26
  bounceValue = 0.1
  readonly leftLane = -1
  readonly rightLane = 1
  readonly middleLane = 0
  readonly clock = new THREE.Clock()
  jumping = false
  readonly treesInPath: THREE.Object3D[] = []
  readonly treesPool = Array(10).fill(0).map(_ => this.createTree())
  explosionPower = 1.06
  score = 0
  hasCollided = false

  constructor () {
    {
      const infoText = document.createElement('div')
      infoText.style.position = 'absolute'
      infoText.style.backgroundColor = 'yellow'
      infoText.innerHTML = 'UP - Jump, Left/Right - Move'
      infoText.style.top = 10 + 'px'
      infoText.style.left = 10 + 'px'
      document.body.appendChild(infoText)
    }
    {
      this.scene.add(new THREE.HemisphereLight(0xfffafa,0x000000, 0.9))
      const sun = new THREE.DirectionalLight(0xcdc1c5, 0.9)
      sun.position.set(12,6,-7)
      sun.castShadow = true
      // Set up shadow properties for the sun light
      sun.shadow.mapSize.width = 256
      sun.shadow.mapSize.height = 256
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far = 50
      this.scene.add(sun)
    }
    {
      const sides = 40
      const tiers = 40
      const geometry = new THREE.SphereGeometry(this.worldRadius, sides, tiers)
      const nextVertex = new THREE.Vector3()
      for (let j = 1; j < tiers - 2; j++) {
        const currentTier = j
        for (let i = 0; i < sides; i++) {
          const index = currentTier * sides + 1 + i
          const vertexVector = geometry.vertices[index].clone()
          if (j % 2 !== 0) {
            nextVertex.copy(geometry.vertices[i < sides - 1 ? index + 1 : 0])
            vertexVector.lerp(nextVertex, rand(0.25, 0.75))
          }
          const heightValue = rand(-0.035, 0.035)
          const offset = vertexVector.clone().normalize().multiplyScalar(heightValue)
          geometry.vertices[index] = vertexVector.add(offset)
        }
      }

      const material = new THREE.MeshStandardMaterial({ color: 0xfffafa, flatShading: true })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.receiveShadow = true
      mesh.castShadow = false
      mesh.rotation.z = -Math.PI / 2
      mesh.position.setY(-24).setZ(2)
      this.scene.add(mesh)
      this.rollingGroundSphere = mesh

      for (let i = 0; i < 36; i++) {
        this.addTree(false, i * 0.17, true)
        this.addTree(false, i * 0.17, false)
      }
    }

    window.addEventListener('resize', () => {
      this.sceneHeight = window.innerHeight
      this.sceneWidth = window.innerWidth
      this.renderer.setSize(this.sceneWidth, this.sceneHeight)
      this.camera.aspect = this.sceneWidth / this.sceneHeight
      this.camera.updateProjectionMatrix()
    }, false)

    document.onkeydown = ({ keyCode }) => {
      if (this.jumping) return

      const setLane = (lane: number) => {
        this.currentLane = lane
        this.jumping = true
        this.bounceValue = 0.06
      }

      switch (keyCode) {
        case 37: // left
          if (this.currentLane === this.middleLane) {
            setLane(this.leftLane)
          } else if (this.currentLane === this.rightLane) {
            setLane(this.middleLane)
          }
          break
        case 39: // right
          if (this.currentLane === this.middleLane) {
            setLane(this.rightLane)
          } else if (this.currentLane === this.leftLane) {
            setLane(this.middleLane)
          }
          break
        case 38: // up
          this.bounceValue = 0.1
          this.jumping = true
      }
    }

    this.update()
  }

  addTree (inPath: boolean, row: number, isLeft = false) {
    let tree
    const sphericalHelper = new THREE.Spherical()
    if (inPath) {
      if (this.treesPool.length === 0) return
      tree = this.treesPool.pop()!
      tree.visible = true
      this.treesInPath.push(tree)
      const pathAngleValues = [1.52, 1.57, 1.62]
      sphericalHelper.set(this.worldRadius - 0.3, pathAngleValues[row], -this.rollingGroundSphere.rotation.x + 4)
    } else {
      tree = this.createTree()
      const forestAreaAngle = rand(1.36, 1.46) + (isLeft ? 0.32 : 0)
      sphericalHelper.set(this.worldRadius - 0.3, forestAreaAngle, row)
    }
    tree.position.setFromSpherical(sphericalHelper)
    const rollingGroundVector = this.rollingGroundSphere.position.clone().normalize()
    const treeVector = tree.position.clone().normalize()
    tree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector)
    tree.rotation.x += Math.PI * rand(-0.1, 0.2)

    this.rollingGroundSphere.add(tree)
  }

  createTree () {
    const sides = 8
    const scalarMultiplier = rand(0.05, 0.2)
    const treeGeometry = new THREE.ConeGeometry(0.5, 1, sides, 6)
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x33ff33, flatShading: true })

    const blowUpTree = (currentTier: number, scalarMultiplier: number, odd = false) => {
      const { vertices } = treeGeometry
      const midPointVector = vertices[0].clone()
      for (let i = 0; i < sides; i++) {
        const index = currentTier * sides + 1 + i
        const v = vertices[index]
        midPointVector.y = v.y
        const offset = v.clone().sub(midPointVector)
        if (odd) {
          if (i % 2 === 0) {
            offset.normalize().multiplyScalar(scalarMultiplier / 6)
            v.add(offset)
          } else {
            offset.normalize().multiplyScalar(scalarMultiplier)
            v.add(offset)
            v.y = vertices[index + sides].y + 0.05
          }
        } else {
          if (i % 2 !== 0) {
            offset.normalize().multiplyScalar(scalarMultiplier / 6)
            v.add(offset)
          } else {
            offset.normalize().multiplyScalar(scalarMultiplier)
            v.add(offset)
            v.y = vertices[index + sides].y + 0.05
          }
        }
      }
    }

    const tightenTree = (currentTier: number) => {
      const { vertices } = treeGeometry
      const midPointVector = vertices[0].clone()
      for (let i = 0; i < sides; i++) {
        const v = vertices[currentTier * sides + 1 + i]
        midPointVector.y = v.y
        const offset = v.clone().sub(midPointVector)
        offset.normalize().multiplyScalar(0.06)
        v.sub(offset)
      }
    }

    blowUpTree(0, scalarMultiplier)
    tightenTree(1)
    blowUpTree(2, scalarMultiplier * 1.1, true)
    tightenTree(3)
    blowUpTree(4, scalarMultiplier * 1.2)
    tightenTree(5)
    const top = new THREE.Mesh(treeGeometry, treeMaterial)
    top.castShadow = true
    top.receiveShadow = false
    top.position.y = 0.9
    top.rotation.y = Math.random() * Math.PI
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x886633, flatShading: true }),
    )
    trunk.position.y = 0.25
    const tree = new THREE.Object3D()
    tree.add(trunk)
    tree.add(top)
    return tree
  }

  update () {
    const addPathTree = () => {
      const options = [0, 1, 2]
      const i = Math.floor(Math.random() * options.length)
      this.addTree(true, options.splice(i, 1)[0])
      if (Math.random() > 0.5) {
        const i = Math.floor(Math.random() * options.length)
        this.addTree(true, options.splice(i, 1)[0])
      }
    }

    const doTreeLogic = () => {
      const treePos = new THREE.Vector3()
      const { treesInPath } = this
      for (let i = treesInPath.length - 1; i >= 0; i--) {
        const tree = treesInPath[i]
        treePos.setFromMatrixPosition(tree.matrixWorld)
        if (treePos.z > 6 && tree.visible) {// gone out of our view zone
          treesInPath.splice(i, 1)
          tree.visible = false
          this.treesPool.push(tree)
        } else if (treePos.distanceTo(heroSphere.position) <= 0.6) {
          this.hasCollided = true

          this.particles.position.set(heroSphere.position.x, 2, 4.8)
          const geometry = this.particles.geometry as THREE.Geometry
          geometry.vertices.forEach((v) => {
            v.set(
              -0.2 + Math.random() * 0.4,
              -0.2 + Math.random() * 0.4,
              -0.2 + Math.random() * 0.4,
            )
          })
          this.explosionPower = 1.07
          this.particles.visible = true
        }
      }
    }

    const doExplosionLogic = () => {
      if (!this.particles.visible) return
      const geometry = this.particles.geometry as THREE.Geometry
      geometry.vertices.forEach(v => v.multiplyScalar(this.explosionPower))
      if (this.explosionPower > 1.005) {
        this.explosionPower -= 0.001
      } else {
        this.particles.visible = false
      }
      geometry.verticesNeedUpdate = true
    }

    this.rollingGroundSphere.rotation.x += 0.008
    const { heroSphere, clock } = this
    heroSphere.rotation.x -= 0.2
    if (heroSphere.position.y <= this.heroBaseY) {
      this.jumping = false
      this.bounceValue = rand(0.005, 0.045)
    }
    heroSphere.position.y += this.bounceValue
    heroSphere.position.x = THREE.Math.lerp(
      heroSphere.position.x,
      this.currentLane,
      2 * clock.getDelta(),
    )
    this.bounceValue -= 0.005
    const treeReleaseInterval = 0.5
    if (clock.getElapsedTime() > treeReleaseInterval) {
      clock.start()
      addPathTree()
      if (!this.hasCollided) {
        this.score += 2 * treeReleaseInterval
        this.scoreText.innerHTML = this.score.toString()
      }
    }
    doTreeLogic()
    doExplosionLogic()
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => this.update())// request next update
  }
}()
