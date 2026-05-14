import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'

export default function Camera(props: any) {
  const ref = useRef<PerspectiveCameraImpl>(null!)
  useFrame(() => ref.current?.updateMatrixWorld())
  return <perspectiveCamera ref={ref} makeDefault {...props} />
}
