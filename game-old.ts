console.clear()
// import 'util'

function rand (from: number, to: number) {
  return Math.random() * (to - from) + from
}

let sceneWidth = window.innerWidth
let sceneHeight = window.innerHeight

const camera = (() => {
  const camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 0.1, 1000)
  camera.position.setZ(6.5).setY(2.5)
  return camera
})()

const scene = (() => {
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xf0fff0, 0.14)
  return scene
})()

const renderer = (() => {
  // renderer with transparent backdrop
  const renderer = new THREE.WebGLRenderer({ alpha: true })
  renderer.setClearColor(0xfffafa, 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(sceneWidth, sceneHeight)
  document.body.appendChild(renderer.domElement)
  return renderer
})()

const scoreText = (() => {
  const scoreText = document.createElement('div')
  scoreText.style.position = 'absolute'
  scoreText.innerHTML = '0'
  scoreText.style.top = 50 + 'px'
  scoreText.style.left = 10 + 'px'
  document.body.appendChild(scoreText)
  return scoreText
})()

const heroBaseY = 1.8
let currentLane = 0
const heroSphere = (() => {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.2, 1),
    new THREE.MeshStandardMaterial({ color: 0xe5f2f2 ,flatShading: true }),
  )
  mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.position.y = heroBaseY
  mesh.position.z = 4.8
  mesh.position.x = currentLane
  scene.add(mesh)
  return mesh
})()

const particles = (() => {
  const geometry = new THREE.Geometry()
  for (let i = 0; i < 20; i++) {
    geometry.vertices.push(new THREE.Vector3())
  }
  const material = new THREE.PointsMaterial({
    color: 0xfffafa,
    size: 0.2,
  })
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  particles.visible = false
  return particles
})()

let rollingGroundSphere: THREE.Mesh
const worldRadius = 26
let bounceValue = 0.1
const leftLane = -1
const rightLane = 1
const middleLane = 0
const clock = new THREE.Clock()
let jumping = false
const treesInPath: THREE.Object3D[] = []
const treesPool = Array(10).fill(0).map(_ => createTree())
let explosionPower = 1.06
let score = 0
let hasCollided = false

init()

function init () {
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
    scene.add(new THREE.HemisphereLight(0xfffafa,0x000000, 0.9))
    const sun = new THREE.DirectionalLight(0xcdc1c5, 0.9)
    sun.position.set(12,6,-7)
    sun.castShadow = true
    // Set up shadow properties for the sun light
    sun.shadow.mapSize.width = 256
    sun.shadow.mapSize.height = 256
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 50
    scene.add(sun)
  }
  {
    const sides = 40
    const tiers = 40
    const geometry = new THREE.SphereGeometry(worldRadius, sides, tiers)
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
    scene.add(mesh)
    rollingGroundSphere = mesh

    for (let i = 0; i < 36; i++) {
      addTree(false, i * 0.17, true)
      addTree(false, i * 0.17, false)
    }
  }

  window.addEventListener('resize', () => {
    sceneHeight = window.innerHeight
    sceneWidth = window.innerWidth
    renderer.setSize(sceneWidth, sceneHeight)
    camera.aspect = sceneWidth / sceneHeight
    camera.updateProjectionMatrix()
  }, false)

  document.onkeydown = ({ keyCode }) => {
    if (jumping) return

    const setLane = (lane: number) => {
      currentLane = lane
      jumping = true
      bounceValue = 0.06
    }

    switch (keyCode) {
      case 37: // left
        if (currentLane === middleLane) {
          setLane(leftLane)
        } else if (currentLane === rightLane) {
          setLane(middleLane)
        }
        break
      case 39: // right
        if (currentLane === middleLane) {
          setLane(rightLane)
        } else if (currentLane === leftLane) {
          setLane(middleLane)
        }
        break
      case 38: // up
        bounceValue = 0.1
        jumping = true
    }
  }

	// call game loop
  update()
}

function addTree (inPath: boolean, row: number, isLeft = false) {
  let tree
  const sphericalHelper = new THREE.Spherical()
  if (inPath) {
    if (treesPool.length === 0) return
    tree = treesPool.pop()!
    tree.visible = true
    treesInPath.push(tree)
    const pathAngleValues = [1.52, 1.57, 1.62]
    sphericalHelper.set(worldRadius - 0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x + 4)
  } else {
    tree = createTree()
    const forestAreaAngle = rand(1.36, 1.46) + (isLeft ? 0.32 : 0)
    sphericalHelper.set(worldRadius - 0.3, forestAreaAngle, row)
  }
  tree.position.setFromSpherical(sphericalHelper)
  const rollingGroundVector = rollingGroundSphere.position.clone().normalize()
  const treeVector = tree.position.clone().normalize()
  tree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector)
  tree.rotation.x += Math.PI * rand(-0.1, 0.2)

  rollingGroundSphere.add(tree)
}

function createTree () {
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

function update () {
  const addPathTree = () => {
    const options = [0, 1, 2]
    const i = Math.floor(Math.random() * options.length)
    addTree(true, options.splice(i, 1)[0])
    if (Math.random() > 0.5) {
      const i = Math.floor(Math.random() * options.length)
      addTree(true, options.splice(i, 1)[0])
    }
  }

  const doTreeLogic = () => {
    const treePos = new THREE.Vector3()
    for (let i = treesInPath.length - 1; i >= 0; i--) {
      const tree = treesInPath[i]
      treePos.setFromMatrixPosition(tree.matrixWorld)
      if (treePos.z > 6 && tree.visible) {// gone out of our view zone
        treesInPath.splice(i, 1)
        tree.visible = false
        treesPool.push(tree)
      } else if (treePos.distanceTo(heroSphere.position) <= 0.6) {
        hasCollided = true

        particles.position.set(heroSphere.position.x, 2, 4.8)
        const geometry = particles.geometry as THREE.Geometry
        geometry.vertices.forEach((v) => {
          v.set(
            -0.2 + Math.random() * 0.4,
            -0.2 + Math.random() * 0.4,
            -0.2 + Math.random() * 0.4,
          )
        })
        explosionPower = 1.07
        particles.visible = true
      }
    }
  }

  const doExplosionLogic = () => {
    if (!particles.visible) return
    const geometry = particles.geometry as THREE.Geometry
    geometry.vertices.forEach(v => v.multiplyScalar(explosionPower))
    if (explosionPower > 1.005) {
      explosionPower -= 0.001
    } else {
      particles.visible = false
    }
    geometry.verticesNeedUpdate = true
  }

  rollingGroundSphere.rotation.x += 0.008
  heroSphere.rotation.x -= 0.2
  if (heroSphere.position.y <= heroBaseY) {
    jumping = false
    bounceValue = rand(0.005, 0.045)
  }
  heroSphere.position.y += bounceValue
  heroSphere.position.x = THREE.Math.lerp(
    heroSphere.position.x,
    currentLane,
    2 * clock.getDelta(),
  )
  bounceValue -= 0.005
  const treeReleaseInterval = 0.5
  if (clock.getElapsedTime() > treeReleaseInterval) {
    clock.start()
    addPathTree()
    if (!hasCollided) {
      score += 2 * treeReleaseInterval
      scoreText.innerHTML = score.toString()
    }
  }
  doTreeLogic()
  doExplosionLogic()
  renderer.render(scene, camera)
  requestAnimationFrame(update)// request next update
}
