import { Physics } from '@react-three/cannon'
import { Stars } from '@react-three/drei'
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import GameDirector from './components/GameDirector'
import FPSControls from './components/three/FPSControls'
import GroundPlane from './components/three/GroundPlane'
import Skydome from './components/three/Skydome'
import { FOG_COLOR } from './theme'

export default function App () {
  const contactMaterial = {
    contactEquationStiffness: 1e4,
    friction: 0.001,
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 15], near: 0.1, far: 100000 }}
      onCreated={({ camera }) => {
        camera.up.set(0, 0, 1)
        camera.rotation.order = 'YZX'
      }}
    >
      <fog attach="fog" args={[FOG_COLOR, 1, 40]}/>
      <ambientLight intensity={0.25} />
      <directionalLight
        intensity={0.25}
        position={[2000, 2000, 1000]}
        castShadow
      />
      <Skydome />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
      />
      <Physics gravity={[0, 0, -25]} defaultContactMaterial={contactMaterial}>
        <PhysicsWorld />
      </Physics>
    </Canvas>
  )
}

export function PhysicsWorld() {
  const setPaused = (paused: boolean) => {
    if (paused)
      document.getElementById('pause')!.classList.add('visible')
    else
      document.getElementById('pause')!.classList.remove('visible')
  }
  setPaused(document.pointerLockElement !== document.body)

  const spawn: [number, number, number] = [8, 0, 1]
  return (
    <Suspense fallback={null}>
      <GroundPlane/>
      <FPSControls position={spawn} rotation={[Math.PI/2, 0, -Math.PI/2]} setPaused={setPaused} />
      <GameDirector />
    </Suspense>
  )
}
