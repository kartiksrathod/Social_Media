import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, Users, Shield, Zap, ArrowRight, Menu, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LazyImage from '@/components/ui/lazy-image';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-glow">SocialVibe</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Stories</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <div className="flex items-center gap-4 ml-4">
              <Button variant="ghost" onClick={() => navigate('/login')} className="hover:text-primary">Login</Button>
              <Button onClick={() => navigate('/signup')} className="button-neon bg-primary hover:bg-primary/90">Get Started</Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-border p-4 flex flex-col gap-4 animate-accordion-down">
            <a href="#features" className="p-2 hover:bg-muted rounded-lg">Features</a>
            <a href="#testimonials" className="p-2 hover:bg-muted rounded-lg">Stories</a>
            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Login</Button>
            <Button className="w-full" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                The future of social connection
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight">
                Connect beyond <br />
                <span className="text-transparent bg-clip-text bg-gradient-primary">boundaries.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience a social platform designed for meaningful interactions, not just scrolling. Join millions building real communities today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full button-neon bg-primary hover:bg-primary/90" onClick={() => navigate('/signup')}>
                  Start for free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full hover:bg-muted border-primary/30 hover:border-primary" onClick={() => navigate('/login')}>
                  View Demo
                </Button>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-muted-foreground">
                <div className="flex -space-x-4">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                         <LazyImage 
                           src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                           alt="user"
                           className="w-full h-full object-cover"
                         />
                      </div>
                   ))}
                </div>
                <p className="text-sm"><strong className="text-foreground">10k+</strong> early adopters</p>
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-[600px] lg:max-w-none">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20 border border-border/50 bg-card/50 backdrop-blur-sm">
                 <LazyImage 
                    src="https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbm5lY3Rpb258ZW58MHx8fHwxNzY0NjgwODM3fDA&ixlib=rb-4.1.0&q=85" 
                    alt="App Dashboard" 
                    className="object-cover w-full h-full opacity-90 hover:scale-105 transition-transform duration-700"
                    loading="eager"
                 />
                 
                 {/* Floating Elements - Glassmorphism */}
                 <div className="absolute top-10 left-10 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/20 shadow-lg animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                          <CheckCircle className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="font-bold text-sm">Connection Established</p>
                          <p className="text-xs text-muted-foreground">Just now</p>
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-20 right-10 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/20 shadow-lg animate-slide-in-up" style={{animationDelay: '0.5s'}}>
                    <div className="flex items-center gap-3">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                             <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" />
                             </div>
                          ))}
                       </div>
                       <div>
                          <p className="font-bold text-sm">Active Community</p>
                          <p className="text-xs text-muted-foreground">+128 new members</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30 relative">
         <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6">Everything you need to <span className="text-primary">grow together</span></h2>
               <p className="text-lg text-muted-foreground">Powerful features designed to help you build, manage, and scale your community effortlessly.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { icon: Users, title: "Community Groups", desc: "Create dedicated spaces for any topic. Private or public, you decide." },
                  { icon: Shield, title: "Smart Moderation", desc: "AI-powered tools to keep your community safe and welcoming." },
                  { icon: Zap, title: "Instant Messaging", desc: "Real-time chat with rich media support and voice notes." }
               ].map((feature, i) => (
                  <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-background">
                     <CardContent className="p-8 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                           <feature.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold font-heading">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-20 pb-10">
         <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                     </div>
                     <span className="font-heading font-bold text-xl">SocialVibe</span>
                  </div>
                  <p className="text-muted-foreground max-w-xs">
                     Building the next generation of digital communities. Connect, share, and grow with us.
                  </p>
               </div>
               <div>
                  <h4 className="font-bold mb-6">Platform</h4>
                  <ul className="space-y-4 text-muted-foreground">
                     <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-6">Company</h4>
                  <ul className="space-y-4 text-muted-foreground">
                     <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                  </ul>
               </div>
            </div>
            <div className="text-center pt-8 border-t border-border text-sm">
               <p className="font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
                  MADE WITH <span className="text-red-500 animate-pulse">❤️</span> BY KARTIK S RATHOD
               </p>
               <div className="flex items-center justify-center gap-4">
                  <a 
                     href="https://www.linkedin.com/in/kartik-s-rathod" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform"
                     title="LinkedIn Profile"
                  >
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                     </svg>
                  </a>
                  <a 
                     href="https://github.com/kartiksrathod" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform"
                     title="GitHub Profile"
                  >
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                     </svg>
                  </a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
