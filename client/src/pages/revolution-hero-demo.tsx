import WebGLHero from "@/components/ui/revolution-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function RevolutionHeroDemo() {
  return (
    <div className="min-h-screen bg-black">
      {/* Full-screen Revolution Hero Component */}
      <WebGLHero />
      
      {/* Additional content below the hero */}
      <div className="bg-gradient-to-b from-black via-gray-900 to-black py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Component Info Card */}
          <Card className="p-8 bg-gray-900/50 backdrop-blur border-gray-800">
            <h2 className="text-3xl font-bold text-white mb-4">Revolution Hero Component</h2>
            <p className="text-gray-300 mb-6">
              A stunning WebGL-powered hero section featuring dynamic shader animations,
              interactive mouse effects, and smooth GSAP transitions. Perfect for making
              a bold statement on your landing page.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Features</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>✦ WebGL shader animations with fluid motion</li>
                  <li>✦ Interactive mouse tracking effects</li>
                  <li>✦ GSAP-powered smooth transitions</li>
                  <li>✦ Fully responsive design</li>
                  <li>✦ Customizable color gradients</li>
                  <li>✦ Performance optimized rendering</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Usage</h3>
                <div className="bg-black/50 p-4 rounded-lg">
                  <code className="text-cyan-400 text-sm">
                    <pre>{`import WebGLHero from "@/components/ui/revolution-hero";

function App() {
  return <WebGLHero />
}`}</pre>
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Interactive Demo Controls */}
          <Card className="p-8 bg-gray-900/50 backdrop-blur border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Interactive Demo</h3>
            <p className="text-gray-400 mb-6">
              Move your mouse over the hero section above to see the interactive effects.
              The shader responds to mouse movement with dynamic intensity changes and
              color variations.
            </p>
            
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                Scroll to Top
              </Button>
              <Link href="/">
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          {/* Technical Details */}
          <Card className="p-8 bg-gray-900/50 backdrop-blur border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Technical Details</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-2">WebGL Shaders</h4>
                <p className="text-gray-400 text-sm">
                  Custom vertex and fragment shaders create the fluid, plasma-like effects
                  with multiple noise layers and voronoi patterns.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-purple-400 mb-2">GSAP Animations</h4>
                <p className="text-gray-400 text-sm">
                  Smooth transitions and hover effects powered by GSAP for buttery-smooth
                  60fps animations on navigation links.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-pink-400 mb-2">Performance</h4>
                <p className="text-gray-400 text-sm">
                  Optimized rendering loop with requestAnimationFrame and efficient
                  shader calculations for smooth performance.
                </p>
              </div>
            </div>
          </Card>

          {/* Customization Guide */}
          <Card className="p-8 bg-gray-900/50 backdrop-blur border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Customization Guide</h3>
            <div className="space-y-4 text-gray-400">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Colors</h4>
                <p>
                  Modify the color palette in the fragment shader. Look for <code className="text-cyan-400">color1</code> through <code className="text-cyan-400">color7</code> variables
                  to change the gradient colors.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Animation Speed</h4>
                <p>
                  Adjust the <code className="text-cyan-400">u_time</code> multiplier in the shader to speed up or slow down
                  the fluid animations.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Navigation Links</h4>
                <p>
                  Update the <code className="text-cyan-400">navLinks</code> array to customize the navigation items
                  and their destinations.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Text Content</h4>
                <p>
                  Customize the hero text, call-to-action messages, and footer content
                  directly in the component JSX.
                </p>
              </div>
            </div>
          </Card>

          {/* Integration Examples */}
          <Card className="p-8 bg-gray-900/50 backdrop-blur border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Integration Examples</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">As a Landing Page Hero</h4>
                <div className="bg-black/50 p-4 rounded-lg">
                  <code className="text-green-400 text-sm">
                    <pre>{`// In your landing page component
import WebGLHero from "@/components/ui/revolution-hero";

export default function LandingPage() {
  return (
    <>
      <WebGLHero />
      {/* Rest of your landing page content */}
    </>
  );
}`}</pre>
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">With Custom Props (Future Enhancement)</h4>
                <div className="bg-black/50 p-4 rounded-lg">
                  <code className="text-yellow-400 text-sm">
                    <pre>{`// Potential future enhancement
<WebGLHero
  navLinks={customLinks}
  heroText="Your Custom Text"
  ctaMessage="Your Call to Action"
  colorScheme="purple"
/>`}</pre>
                  </code>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}