import { useCylinder } from '@react-three/cannon'
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3 } from 'three'
import { DEBUG_POSITION } from '../../config'

const PLAYER_HEIGHT = 1
const PLAYER_RADIUS = 0.35
const MOUSE_SENSITIVITY = 1000

type FPSControlsProps = {
  setPaused: any,
  rotation?: [number, number, number],
  position?: [number, number, number],
}

export default function FPSControls(props: FPSControlsProps) {
  const cylinderArgs: [number, number, number, number] = [PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 8]
  const [playerCylinder, cylinderBody] = useCylinder<Mesh>(() => ({
    mass: 1,
    linearDamping: 0.9999,
    fixedRotation: true,
    args: cylinderArgs,
    position: props.position || [0, 0, 0],
  }))

  const camera = useThree(state => state.camera)

  const [keyStates] = useState<any>({})

  // The cannon worker doesn't reliably sync the body position onto the mesh
  // (the mesh stays frozen at spawn), so we subscribe to the body position
  // directly and drive the camera from it.
  const bodyPosition = useRef<[number, number, number]>(props.position || [0, 0, 0])

  useEffect(() => {
    const unsub = cylinderBody.position.subscribe((p) => {
      bodyPosition.current = p
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    camera.up.set(0, 0, 1)
    camera.rotation.order = 'YZX'
    camera.rotation.x = props.rotation ? props.rotation[0] : 0
    camera.rotation.y = 0
    camera.rotation.z = props.rotation ? props.rotation[2] : 0

    const onKeydown = (event: KeyboardEvent) => {
      keyStates[event.code] = true

      if (event.code === 'Escape' && document.pointerLockElement === document.body) {
        props.setPaused(true)
        document.exitPointerLock()
      }
      else if (event.code === 'KeyR') {
        console.log('Hackermode enabled')
        cylinderBody.position.set(91, 56, 0)
      }
    }
    const onKeyup = (event: KeyboardEvent) => keyStates[event.code] = false
    const onMousedown = () => {
      if (document.pointerLockElement === document.body) return
      const req = document.body.requestPointerLock() as unknown as Promise<void> | undefined
      if (req && typeof req.catch === 'function') req.catch(() => {})
    }
    const onMousemove = (event: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return
      camera.rotation.z -= event.movementX / MOUSE_SENSITIVITY
      camera.rotation.x -= event.movementY / MOUSE_SENSITIVITY
    }
    const onPointerLockChange = () => {
      const paused = document.pointerLockElement !== document.body
      props.setPaused(paused)
    }

    document.addEventListener('mousemove', onMousemove)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('keyup', onKeyup)
    document.addEventListener('mousedown', onMousedown)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      document.removeEventListener('mousemove', onMousemove)
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('keyup', onKeyup)
      document.removeEventListener('mousedown', onMousedown)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getForwardVector = () => {
    const playerDirection = new Vector3()
    camera.getWorldDirection(playerDirection)
    playerDirection.z = 0
    playerDirection.normalize()
    return playerDirection
  }

  const getSideVector = () => {
    const playerDirection = new Vector3()
    camera.getWorldDirection(playerDirection)
    playerDirection.z = 0
    playerDirection.normalize()
    playerDirection.cross(camera.up)
    return playerDirection
  }

  useFrame(() => {
    const [px, py, pz] = bodyPosition.current
    camera.position.set(px, py, pz + PLAYER_HEIGHT/2)

    const inputVelocity = new Vector3()
    let MOVESPEED = 5
    if (keyStates['ShiftLeft']) MOVESPEED *= 2

    if (keyStates['KeyW']) inputVelocity.add(getForwardVector())
    if (keyStates['KeyS']) inputVelocity.sub(getForwardVector())
    if (keyStates['KeyA']) inputVelocity.sub(getSideVector())
    if (keyStates['KeyD']) inputVelocity.add(getSideVector())

    const debug = document.getElementById('debug')
    if (debug && DEBUG_POSITION) {
      const pressed = Object.keys(keyStates).filter(k => keyStates[k]).join(',') || '(none)'
      debug.innerHTML = `pos(${px.toFixed(1)}, ${py.toFixed(1)}, ${pz.toFixed(1)})`
        + ` | keys: ${pressed}`
        + ` | input(${inputVelocity.x.toFixed(2)}, ${inputVelocity.y.toFixed(2)}, ${inputVelocity.z.toFixed(2)})`
    }

    if (inputVelocity.x === 0 && inputVelocity.y === 0 && inputVelocity.z === 0)
      return

    inputVelocity.normalize().multiplyScalar(MOVESPEED)
    cylinderBody.velocity.set(inputVelocity.x, inputVelocity.y, inputVelocity.z)
  })

  return (
    <mesh ref={playerCylinder} visible={false}>
      <cylinderGeometry args={cylinderArgs}/>
      <meshBasicMaterial color="green" wireframe/>
    </mesh>
  )
}
