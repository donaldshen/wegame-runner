import * as THREE from 'three'
import { rand } from './util'

export default class Particles {
  readonly points = (() => {
    const geometry = new THREE.Geometry()
    for (let i = 0; i < 20; i++) {
      geometry.vertices.push(new THREE.Vector3())
    }
    const material = new THREE.PointsMaterial({
      color: 0xfffafa,
      size: 0.2,
    })
    const points = new THREE.Points(geometry, material)
    points.visible = false
    return points
  })()

  explosionPower = 1.06

  reset (x: number) {
    this.points.position.set(x, 2, 4.8)
    const geometry = this.points.geometry as THREE.Geometry
    geometry.vertices.forEach((v) => {
      v.set(
        rand(-0.2, 0.2),
        rand(-0.2, 0.2),
        rand(-0.2, 0.2),
      )
    })
    this.explosionPower = 1.07
    this.points.visible = true
  }

  update () {
    if (!this.points.visible) return

    const geometry = this.points.geometry as THREE.Geometry
    geometry.vertices.forEach(v => v.multiplyScalar(this.explosionPower))
    if (this.explosionPower > 1.005) {
      this.explosionPower -= 0.001
    } else {
      this.points.visible = false
    }
    geometry.verticesNeedUpdate = true
  }
}
