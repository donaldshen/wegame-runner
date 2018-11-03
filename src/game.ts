import * as THREE from 'three'
import { rand } from './util'
import View from './View'
import Hero from './Hero'
import Particles from './Particles'
import Ground from './Ground'
import Tree from './Tree'
import * as font from './fonts/helvetiker_regular.typeface.json'

new class Game {
  readonly view = new View()
  readonly hero = new Hero()
  readonly particles = new Particles()
  readonly ground = new Ground()

  readonly clock = new THREE.Clock()
  readonly treesInPath: Tree[] = []
  readonly treesPool = Array(10).fill(0).map(_ => new Tree())
  score = 0
  scoreMesh = this.updateScore()

  constructor () {
    this.view.add(this.hero.mesh)
    this.view.add(this.particles.points)
    this.view.add(this.ground.mesh)

    for (let i = 0; i < 36; i++) {
      this.addWorldTree(i * 0.17, true)
      this.addWorldTree(i * 0.17, false)
    }

    this.update()
  }

  updateScore () {
    const text = `${this.score}`
    const geometry = new THREE.TextGeometry(text, {
      font: new THREE.Font(font),
      size: 0.5,
      height: 0.2,
    })
    const material = new THREE.MeshPhongMaterial({
      color: 0xfed35f,
      flatShading: true,
    })
    const mesh = new THREE.Mesh(geometry, material)
    if (this.scoreMesh) {
      this.view.remove(this.scoreMesh)
    }
    mesh.position.set(-0.2, 4, 0)
    mesh.rotation.x = Math.PI * 0.1
    this.view.add(mesh)
    this.scoreMesh = mesh
    return mesh
  }

  addWorldTree (theta: number, isLeft = false) {
    const tree = new Tree()
    const forestAreaAngle = rand(1.36, 1.46) + (isLeft ? 0.32 : 0)
    tree.obj.position.setFromSpherical(
      new THREE.Spherical(this.ground.radius - 0.3, forestAreaAngle, theta),
    )
    this.ground.add(tree)
  }

  addPathTree (row: number) {
    if (this.treesPool.length === 0) return
    const tree = this.treesPool.pop()!
    tree.obj.visible = true
    this.treesInPath.push(tree)
    const pathAngleValues = [1.52, 1.57, 1.62]
    tree.obj.position.setFromSpherical(
      new THREE.Spherical(this.ground.radius - 0.3, pathAngleValues[row], -this.ground.mesh.rotation.x + 4),
    )

    this.ground.add(tree)
  }

  update () {
    this.particles.update()
    this.ground.update()
    this.hero.update(this.clock.getDelta())

    const treePos = new THREE.Vector3()
    const { treesInPath } = this
    for (let i = treesInPath.length - 1; i >= 0; i--) {
      const tree = treesInPath[i]
      treePos.setFromMatrixPosition(tree.obj.matrixWorld)
      const { position: target } = this.hero.mesh
      if (treePos.z > 6 && tree.obj.visible) {// gone out of our view zone
        treesInPath.splice(i, 1)
        tree.obj.visible = false
        this.treesPool.push(tree)
      } else if (treePos.distanceTo(target) <= 0.6) {
        this.score = 0
        this.particles.reset(target.x)
      }
    }

    const treeReleaseInterval = 0.5
    if (this.clock.getElapsedTime() > treeReleaseInterval) {
      this.clock.start()
      const options = [0, 1, 2]
      const i = Math.floor(Math.random() * options.length)
      this.addPathTree(options.splice(i, 1)[0])
      if (Math.random() > 0.5) {
        const i = Math.floor(Math.random() * options.length)
        this.addPathTree(options.splice(i, 1)[0])
      }

      this.score += 1
    }
    this.updateScore()

    this.view.update()
    requestAnimationFrame(() => this.update())// request next update
  }
}()
