import * as THREE from 'three'
import { rand } from './util'

export default class Hero {
  private readonly initY = 1.8

  currentLane = 0
  jumping = false
  bounceValue = 0.1
  readonly leftLane = -1
  readonly rightLane = 1
  readonly middleLane = 0

  readonly mesh = (() => {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2, 1),
      new THREE.MeshStandardMaterial({ color: 0xe5f2f2 ,flatShading: true }),
    )
    mesh.receiveShadow = true
    mesh.castShadow = true
    mesh.position.set(this.currentLane, this.initY, 4.8)
    return mesh
  })()

  constructor () {
    const setLane = (lane: number) => {
      this.currentLane = lane
      this.jumping = true
      this.bounceValue = 0.06
    }

    const jump = () => {
      this.bounceValue = 0.1
      this.jumping = true
    }

    const goLeft = () => {
      if (this.currentLane === this.middleLane) {
        setLane(this.leftLane)
      } else if (this.currentLane === this.rightLane) {
        setLane(this.middleLane)
      }
    }

    const goRight = () => {
      if (this.currentLane === this.middleLane) {
        setLane(this.rightLane)
      } else if (this.currentLane === this.leftLane) {
        setLane(this.middleLane)
      }
    }

    if (process.env.NODE_ENV === 'production') {
      let start: wx.types.Touch | undefined
      wx.onTouchStart(({ changedTouches }) => {
        if (start) return
        start = changedTouches[0]
      })
      wx.onTouchEnd(({ changedTouches }) => {
        if (this.jumping) return
        if (!start) return
        const end = changedTouches.find(t => t.identifier === start!.identifier)
        if (!end) return
        const threshold = 50
        if (start.clientY - end.clientY > threshold) {
          jump()
        } else if (end.clientX - start.clientY > threshold) {
          goRight()
        } else if (start.clientX - end.clientY > threshold) {
          goLeft()
        }
        start = undefined
      })
    } else {
      document.onkeydown = ({ keyCode }) => {
        if (this.jumping) return

        switch (keyCode) {
          case 37: // left
            goLeft()
            break
          case 39: // right
            goRight()
            break
          case 38: // up
            jump()
        }
      }
    }
  }

  update (dt: number) {
    const { mesh } = this
    mesh.rotation.x -= 0.2
    if (mesh.position.y <= this.initY) {
      this.jumping = false
      this.bounceValue = rand(0.005, 0.045)
    }
    mesh.position.y += this.bounceValue
    mesh.position.x = THREE.Math.lerp(
      mesh.position.x,
      this.currentLane,
      2 * dt,
    )
    this.bounceValue -= 0.005
  }
}
