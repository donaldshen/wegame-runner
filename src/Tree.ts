import * as THREE from 'three'
import { rand } from './util'

export default class Tree {

  readonly obj = (() => {
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
  })()
}
