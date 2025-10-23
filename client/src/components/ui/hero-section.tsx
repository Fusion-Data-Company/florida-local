import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Shape, ExtrudeGeometry } from 'three';

const Box = memo(({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const shape = useMemo(() => {
        const s = new Shape();
        const angleStep = Math.PI * 0.5;
        const radius = 1;

        s.absarc(2, 2, radius, angleStep * 0, angleStep * 1);
        s.absarc(-2, 2, radius, angleStep * 1, angleStep * 2);
        s.absarc(-2, -2, radius, angleStep * 2, angleStep * 3);
        s.absarc(2, -2, radius, angleStep * 3, angleStep * 4);
        return s;
    }, []);

    const geometry = useMemo(() => {
        const extrudeSettings = {
            depth: 0.3,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 20,
            curveSegments: 20
        };

        const geom = new ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        return geom;
    }, [shape]);

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            <meshPhysicalMaterial 
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                emissive="#000000"
                emissiveIntensity={0}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.0}
                clearcoatRoughness={0.0}
                sheen={0}
                sheenRoughness={1.0}
                sheenColor="#ffffff"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
                side={0}
                alphaTest={0}
                depthWrite={true}
                depthTest={true}
            />
        </mesh>
    );
});

Box.displayName = 'Box';

const AnimatedBoxes = memo(() => {
    const groupRef = useRef<any>();

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.15;
        }
    });

    const boxes = useMemo(() => Array.from({ length: 15 }, (_, index) => ({
        position: [(index - 7.5) * 1.5, 0, 0] as [number, number, number],
        rotation: [
            (index - 7.5) * 0.2,
            Math.PI / 2,
            0
        ] as [number, number, number],
        id: index
    })), []);

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                />
            ))}
        </group>
    );
});

AnimatedBoxes.displayName = 'AnimatedBoxes';

export const Scene = memo(() => {
    const cameraPosition: [number, number, number] = [5, 5, 20];
    
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    if (prefersReducedMotion) {
        return null;
    }

    return (
        <div className="w-full h-full z-0">
            <Canvas 
                camera={{ position: cameraPosition, fov: 40 }}
                gl={{ alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={5} />
                <directionalLight position={[10, 10, 5]} intensity={5} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
});

Scene.displayName = 'Scene';
