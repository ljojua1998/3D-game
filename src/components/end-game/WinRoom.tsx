import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler, Mesh, Vector3 } from 'three'
import { Icosahedron, Text } from '@react-three/drei'
import MazeDeadEnd from '../maze-pieces/MazeDeadEnd'
import { MazeConnection, MazeSegment, MAZEPIECE_HALFWIDTH } from '../maze-pieces/MazeLibrary'
import { applause, partyHorn } from '../../helpers/sound'

export default function WinRoom(props: any) {
  const camera = useThree(state => state.camera)
  const trophy = useRef<Mesh>(null!)
  const [won, setWon] = useState(false)

  const position = new Vector3()
  const rotation = new Euler()
  if (props.position instanceof Array) position.set(...(props.position as [number, number, number]))
  if (props.rotation instanceof Array) rotation.set(...(props.rotation as [number, number, number]))
  if (props.position instanceof Vector3) position.copy(props.position)
  if (props.rotation instanceof Euler) rotation.copy(props.rotation)

  useFrame((_, delta) => {
    if (trophy.current) {
      trophy.current.rotation.y += delta
      trophy.current.rotation.z += delta * 0.5
    }
    if (!won && camera.position.distanceTo(position) < 2.5) {
      setWon(true)
      applause.play()
      partyHorn.play()
      const ui = document.getElementById('discovered-ui')
      if (ui) {
        ui.querySelector('.main-text')!.innerHTML = 'YOU WIN!'
        ui.querySelector('.sub-text')!.innerHTML = 'You reached the end of the maze'
        ui.classList.add('visible')
      }
    }
  })

  return (
    <group>
      <MazeDeadEnd segment={props.segment} rotation={props.rotation} position={props.position} />
      <group position={position} rotation={rotation}>
        <pointLight position={[0, 0.5, 1.4]} intensity={4} distance={7} color={'#ffd76a'} />
        <Icosahedron ref={trophy} args={[0.4]} position={[0, 0.3, 0.9]}>
          <meshStandardMaterial
            color={'#ffcc33'}
            emissive={'#ff8800'}
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.15}
          />
        </Icosahedron>
        <Text
          color={'#ffd76a'}
          position={[0, 0.99, 1.35]}
          rotation={[Math.PI / 2, 0, 0]}
          fontSize={0.32}
          textAlign="center"
        >
          YOU WIN!
        </Text>
      </group>
    </group>
  )
}

export class WinRoomSegment extends MazeSegment {
  public connections: MazeConnection[] = [
    {
      position: new Vector3(0, -MAZEPIECE_HALFWIDTH, 0),
      forward: new Vector3(0, -1, 0),
    },
  ] as MazeConnection[]

  constructor(position: Vector3, rotation: Euler, id?: number) {
    super('win-room', position, rotation, id)
  }
}
