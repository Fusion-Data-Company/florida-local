"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  const handleChange = () => {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    handleChange()

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1], filter: "blur(4px)" }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }

type CarouselItem = {
  tag: string
  count: number
  color: string
}

const Carousel = memo(
  ({
    handleClick,
    controls,
    cards,
    isCarouselActive,
  }: {
    handleClick: (item: CarouselItem, index: number) => void
    controls: any
    cards: CarouselItem[]
    isCarouselActive: boolean
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const cylinderWidth = isScreenSizeSm ? 1600 : 2800
    const faceCount = cards.length
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const rotation = useMotionValue(0)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "2000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) =>
            isCarouselActive &&
            rotation.set(rotation.get() + info.offset.x * 0.05)
          }
          onDragEnd={(_, info) =>
            isCarouselActive &&
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.05,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 30,
                mass: 0.1,
              },
            })
          }
          animate={controls}
        >
          {cards.map((item, i) => (
            <motion.div
              key={`key-${item.tag}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-3xl p-2"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(item, i)}
            >
              <motion.div
                layoutId={`card-${item.tag}`}
                className="pointer-events-none w-full rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)] border-2 border-white/20"
                initial={{ filter: "blur(4px)" }}
                layout="position"
                animate={{ filter: "blur(0px)" }}
                transition={transition}
              >
                {/* Premium Glass Card with Enhanced Gradient */}
                <div className="relative group cursor-pointer h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm">
                  {/* Gradient Header with Premium Glass Effect */}
                  <div className={`h-72 bg-gradient-to-br ${item.color} flex flex-col items-center justify-center relative overflow-hidden`}>
                    {/* Mesh gradient overlay */}
                    <div className="absolute inset-0 opacity-[0.15]" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E")`
                    }} />
                    
                    {/* Animated radial spotlight */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.6),transparent_60%)] group-hover:opacity-50 transition-opacity duration-500" />
                    
                    {/* Accent gradient beam from top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-gradient-to-b from-white/30 via-white/10 to-transparent blur-xl" />
                    
                    {/* Premium floating orb with enhanced glass effect */}
                    <div className="relative z-10 w-32 h-32 rounded-full bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,.25),0_0_0_1px_rgba(255,255,255,.3),inset_0_2px_16px_rgba(255,255,255,.4)] border-2 border-white/40 group-hover:scale-110 group-hover:shadow-[0_12px_40px_rgba(0,0,0,.3),0_0_0_1px_rgba(255,255,255,.4),inset_0_2px_20px_rgba(255,255,255,.5)] transition-all duration-500 ease-out">
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_12px_rgba(255,255,255,.7),inset_0_-2px_8px_rgba(0,0,0,.1)]" />
                      {/* Subtle sparkle effect */}
                      <div className="absolute top-4 right-6 w-3 h-3 bg-white/80 rounded-full blur-sm" />
                      <div className="absolute bottom-6 left-5 w-2 h-2 bg-white/60 rounded-full blur-sm" />
                    </div>
                    
                    {/* Count badge on gradient */}
                    <div className="relative z-10 mt-6 px-6 py-2.5 rounded-full bg-white/25 backdrop-blur-md border border-white/40 shadow-lg">
                      <p className="text-white font-bold text-lg tracking-wide drop-shadow-lg">
                        {item.count} Post{item.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {/* Top hairline with glow */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_1px_8px_rgba(255,255,255,.3)]" />
                    
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                  
                  {/* Premium Content Section with Enhanced Frosted Glass */}
                  <div className="relative bg-gradient-to-b from-white/98 via-white/95 to-white/90 backdrop-blur-2xl p-10 border-t-2 border-white/50">
                    {/* Top inner glow line */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_2px_16px_rgba(255,255,255,1)]" />
                    
                    {/* Subtle corner accents */}
                    <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent blur-2xl" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/40 to-transparent blur-2xl" />
                    
                    {/* Premium Typography */}
                    <h4 className="font-black text-4xl mb-2 bg-gradient-to-br from-gray-950 via-gray-800 to-gray-950 bg-clip-text text-transparent tracking-tight leading-tight drop-shadow-sm">
                      {item.tag}
                    </h4>
                    
                    {/* Decorative underline */}
                    <div className="w-16 h-1 bg-gradient-to-r from-gray-400/50 to-transparent rounded-full mb-4" />
                    
                    {/* Hover indicator */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium group-hover:text-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Click to explore</span>
                    </div>
                  </div>
                  
                  {/* Premium card border glow */}
                  <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)] pointer-events-none" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }
)

Carousel.displayName = "Carousel"

function ThreeDPhotoCarousel({ items }: { items?: CarouselItem[] }) {
  const [activeItem, setActiveItem] = useState<CarouselItem | null>(null)
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  const controls = useAnimation()
  
  const cards = useMemo(
    () => items || [
      { tag: "#ItsGoodAf", count: 30, color: "from-orange-400 to-red-500" },
      { tag: "#KidPowerMoves", count: 1, color: "from-blue-400 to-cyan-500" },
      { tag: "#NeverHuntAlone", count: 1, color: "from-green-400 to-emerald-500" },
      { tag: "#SideHustles", count: 3, color: "from-purple-400 to-pink-500" },
      { tag: "#EffinTrendy", count: 13, color: "from-pink-400 to-rose-500" },
    ],
    [items]
  )

  const handleClick = (item: CarouselItem) => {
    setActiveItem(item)
    setIsCarouselActive(false)
    controls.stop()
  }

  const handleClose = () => {
    setActiveItem(null)
    setIsCarouselActive(true)
  }

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="sync">
        {activeItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`card-container-${activeItem.tag}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-5 md:p-36 lg:px-[19rem]"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.div
              layoutId={`card-${activeItem.tag}`}
              className="max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                willChange: "transform",
              }}
            >
              {/* Expanded Glass Card */}
              <div className="relative">
                {/* Gradient Header */}
                <div className={`h-80 bg-gradient-to-br ${activeItem.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E")`
                  }} />
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,255,255,.5),transparent_70%)]" />
                  
                  {/* Large orb */}
                  <div className="relative z-10 w-32 h-32 rounded-full bg-white/40 backdrop-blur-xl shadow-2xl border border-white/50">
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_16px_rgba(255,255,255,.6)]" />
                  </div>
                  
                  <div className="absolute top-0 inset-x-0 h-px bg-white/20" />
                </div>
                
                {/* Content */}
                <div className="relative bg-white/98 backdrop-blur-2xl p-12 border-t border-white/30">
                  <div className="absolute top-0 inset-x-0 h-px shadow-[0_1px_12px_rgba(255,255,255,.9)]" />
                  
                  <h3 className="font-bold text-5xl mb-4 bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                    {activeItem.tag}
                  </h3>
                  <p className="text-gray-600 font-medium tracking-wide text-xl mb-8">
                    {activeItem.count} Post{activeItem.count !== 1 ? 's' : ''}
                  </p>
                  
                  {/* CTA Button with Glass Effect */}
                  <button className="group inline-flex items-center justify-center px-8 py-4 rounded-2xl border border-white/20 bg-white/20 hover:bg-white/30 active:bg-white/15 backdrop-blur-xl shadow-lg hover:shadow-xl text-gray-900 font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">
                    <span className="relative">
                      <span className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" />
                      Explore Posts
                    </span>
                    <span className="ml-2 w-2.5 h-2.5 rounded-full bg-gray-700 opacity-70 group-hover:opacity-100 transition" />
                  </button>
                  
                  <p className="mt-6 text-sm text-gray-500 italic">Click anywhere to close</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative h-[700px] w-full overflow-hidden rounded-3xl">
        <Carousel
          handleClick={handleClick}
          controls={controls}
          cards={cards}
          isCarouselActive={isCarouselActive}
        />
      </div>
    </motion.div>
  )
}

export { ThreeDPhotoCarousel }
