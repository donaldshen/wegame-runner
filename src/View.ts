import * as THREE from 'three'

export default class View {
  private sceneWidth = window.innerWidth
  private sceneHeight = window.innerHeight
  private get aspect () { return this.sceneWidth / this.sceneHeight }

  private readonly camera = (() => {
    const camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 1000)
    camera.position.set(0.5, 3, 8)
    camera.lookAt(0, 2, 0)
    return camera
  })()

  private readonly scene = (() => {
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf0fff0, 0.14)
    return scene
  })()

  private readonly renderer = (() => {
    // renderer with transparent backdrop
    let renderer
    if (process.env.NODE_ENV === 'production') {
      renderer = new THREE.WebGLRenderer({ alpha: true, canvas })
    } else {
      renderer = new THREE.WebGLRenderer({ alpha: true })
      document.body.appendChild(renderer.domElement)
    }
    renderer.setClearColor(0xfffafa, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(this.sceneWidth, this.sceneHeight)
    return renderer
  })()

  constructor () {
    this.add(new THREE.AxesHelper(5))

    this.add(new THREE.HemisphereLight(0xfffafa, 0x000000, 0.9))

    const sun = new THREE.DirectionalLight(0xcdc1c5, 0.9)
    sun.position.set(12,6,-7)
    sun.castShadow = true
    // Set up shadow properties for the sun light
    sun.shadow.mapSize.width = 256
    sun.shadow.mapSize.height = 256
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 50
    this.add(sun)

    if (process.env.NODE_ENV === 'production') {
      // TODO:
      console.log('UP - Jump, Left/Right - Move')
    } else {
      window.addEventListener('resize', () => {
        this.sceneHeight = window.innerHeight
        this.sceneWidth = window.innerWidth
        this.renderer.setSize(this.sceneWidth, this.sceneHeight)
        this.camera.aspect = this.sceneWidth / this.sceneHeight
        this.camera.updateProjectionMatrix()
      }, false)

      const infoText = document.createElement('div')
      infoText.style.position = 'absolute'
      infoText.style.backgroundColor = 'yellow'
      infoText.innerHTML = 'UP - Jump, Left/Right - Move'
      infoText.style.top = 10 + 'px'
      infoText.style.left = 10 + 'px'
      document.body.appendChild(infoText)
    }
  }

  add (obj: THREE.Object3D) {
    this.scene.add(obj)
  }

  remove (obj: THREE.Object3D) {
    this.scene.remove(obj)
  }

  update () {
    this.renderer.render(this.scene, this.camera)
  }
}
