import * as THREE from 'three'
import { rand } from './util'
import Tree from './Tree'

export default class Ground {
  readonly radius = 26
  readonly mesh = (() => {
    const sides = 40
    const tiers = 40

    const geometry = new THREE.SphereGeometry(this.radius, sides, tiers)
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xfffafa, flatShading: true }),
    )
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
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.rotation.z = -Math.PI / 2
    mesh.position.setY(-24).setZ(2)
    return mesh
  })()

  add (tree: Tree) {
    const groundVector = this.mesh.position.clone().normalize()
    const treeVector = tree.obj.position.clone().normalize()
    tree.obj.quaternion.setFromUnitVectors(treeVector, groundVector)
    tree.obj.rotation.x += Math.PI * rand(-0.1, 0.1)
    this.mesh.add(tree.obj)
  }

  update () {
    this.mesh.rotation.x += 0.005
  }
}
