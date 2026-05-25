import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh } from 'three'
import { Icosahedron, Text } from '@react-three/drei'
import { applause, partyHorn } from '../../helpers/sound'

type Props = {
  position: [number, number, number]
}

export default function EndMarker({ position }: Props) {
  const camera = useThree(state => state.camera)
  const trophy = useRef<Mesh>(null!)
  const [won, setWon] = useState(false)

  useFrame((_, delta) => {
    if (trophy.current) {
      trophy.current.rotation.y += delta
      trophy.current.rotation.z += delta * 0.5
    }
    if (won) return
    const dx = camera.position.x - position[0]
    const dy = camera.position.y - position[1]
    if (Math.sqrt(dx * dx + dy * dy) < 1.5) {
      setWon(true)
      try { applause.play() } catch {}
      try { partyHorn.play() } catch {}
      const ui = document.getElementById('discovered-ui')
      if (ui) {
        const main = ui.querySelector('.main-text')
        const sub = ui.querySelector('.sub-text')
        if (main) main.innerHTML = 'YOU WIN!'
        if (sub) sub.innerHTML = 'You reached the end of the maze'
        ui.classList.add('visible')
      }
    }
  })

  return (
    <group position={position}>
      <pointLight position={[0, 0, 1.4]} intensity={4} distance={7} color={'#ffd76a'} />
      <Icosahedron ref={trophy} args={[0.4]} position={[0, 0, 0.9]}>
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
        position={[0, 0, 1.55]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.32}
        textAlign="center"
      >
        YOU WIN!
      </Text>
    </group>
  )
}
