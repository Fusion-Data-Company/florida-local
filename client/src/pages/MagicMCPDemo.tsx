import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/animations/PageTransition';
import StaggeredList from '@/components/animations/StaggeredList';
import LoadingSpinner from '@/components/animations/LoadingSpinner';
import MagicDataTable from '@/components/magic/MagicDataTable';
import MagicFormWizard from '@/components/magic/MagicFormWizard';
import MagicSearch from '@/components/magic/MagicSearch';
import MagicMap from '@/components/magic/MagicMap';
import MagicCarousel from '@/components/magic/MagicCarousel';
import MagicButton, { MagicLuxuryButton, MagicGlassButton, MagicMetallicButton } from '@/components/magic/MagicButton';
import InteractiveChart from '@/components/visualization/InteractiveChart';
import AnalyticsDashboard from '@/components/visualization/AnalyticsDashboard';
import LazyImage from '@/components/performance/LazyImage';
import VirtualList, { VirtualBusinessList } from '@/components/performance/VirtualList';
import { SkipToMain } from '@/components/accessibility/SkipLink';
import FocusTrap from '@/components/accessibility/FocusTrap';
import LiveRegion from '@/components/accessibility/LiveRegion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Star, 
  Heart, 
  TrendingUp,
  BarChart3,
  Users,
  ShoppingBag,
  MapPin,
  Search,
  Filter,
  Download
} from 'lucide-react';

export default function MagicMCPDemo() {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('components');

  // Sample data for demonstrations
  const sampleBusinesses = [
    { id: '1', name: 'Miami Beach Spa', description: 'Luxury wellness retreat', image: '/api/placeholder/100/100', rating: 4.9 },
    { id: '2', name: 'Coral Gables Restaurant', description: 'Fine dining experience', image: '/api/placeholder/100/100', rating: 4.8 },
    { id: '3', name: 'Brickell Fitness Center', description: 'Premium gym facilities', image: '/api/placeholder/100/100', rating: 4.7 },
    { id: '4', name: 'Wynwood Art Gallery', description: 'Contemporary art showcase', image: '/api/placeholder/100/100', rating: 4.9 },
    { id: '5', name: 'South Beach Hotel', description: 'Oceanfront luxury hotel', image: '/api/placeholder/100/100', rating: 4.8 }
  ];

  const sampleChartData = [
    { label: 'Jan', value: 120, color: '#3b82f6' },
    { label: 'Feb', value: 190, color: '#8b5cf6' },
    { label: 'Mar', value: 300, color: '#06b6d4' },
    { label: 'Apr', value: 500, color: '#10b981' },
    { label: 'May', value: 700, color: '#f59e0b' },
    { label: 'Jun', value: 950, color: '#ef4444' }
  ];

  const sampleTableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', revenue: 15000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive', revenue: 8500 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', revenue: 22000 },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Pending', revenue: 12000 }
  ];

  const tableColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (value: string) => (
      <Badge variant={value === 'Active' ? 'default' : value === 'Inactive' ? 'secondary' : 'outline'}>
        {value}
      </Badge>
    )},
    { key: 'revenue', title: 'Revenue', sortable: true, render: (value: number) => `$${value.toLocaleString()}` }
  ];

  const carouselItems = [
    {
      id: '1',
      type: 'image' as const,
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      title: 'Miami Beach Paradise',
      description: 'Beautiful oceanfront view',
      metadata: { likes: 1250, views: 8900, downloads: 450 }
    },
    {
      id: '2',
      type: 'image' as const,
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      title: 'Art Deco District',
      description: 'Historic Miami architecture',
      metadata: { likes: 890, views: 5600, downloads: 320 }
    },
    {
      id: '3',
      type: 'image' as const,
      src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      title: 'Wynwood Walls',
      description: 'Street art masterpiece',
      metadata: { likes: 2100, views: 12000, downloads: 780 }
    }
  ];

  const mapMarkers = [
    { id: '1', position: { lat: 25.7617, lng: -80.1918 }, title: 'Miami Beach', type: 'business' as const },
    { id: '2', position: { lat: 25.7214, lng: -80.2683 }, title: 'Coral Gables', type: 'business' as const },
    { id: '3', position: { lat: 25.7743, lng: -80.1937 }, title: 'Brickell', type: 'business' as const }
  ];

  const categories = [
    { id: 'restaurants', name: 'Restaurants', color: '#ef4444', icon: '🍽️' },
    { id: 'wellness', name: 'Wellness', color: '#10b981', icon: '🧘' },
    { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6', icon: '🎭' }
  ];

  const analyticsData = {
    metrics: [
      { id: 'revenue', title: 'Total Revenue', value: 125000, change: 12.5, changeType: 'increase' as const, icon: <TrendingUp className="h-5 w-5" />, color: 'bg-emerald-100 text-emerald-600', format: 'currency' as const },
      { id: 'users', title: 'Active Users', value: 2450, change: 8.2, changeType: 'increase' as const, icon: <Users className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600', format: 'number' as const },
      { id: 'orders', title: 'Total Orders', value: 1890, change: -2.1, changeType: 'decrease' as const, icon: <ShoppingBag className="h-5 w-5" />, color: 'bg-purple-100 text-purple-600', format: 'number' as const },
      { id: 'conversion', title: 'Conversion Rate', value: 3.8, change: 0.5, changeType: 'increase' as const, icon: <BarChart3 className="h-5 w-5" />, color: 'bg-orange-100 text-orange-600', format: 'percentage' as const }
    ],
    charts: {
      revenue: sampleChartData,
      users: sampleChartData.map(d => ({ ...d, value: d.value * 0.3 })),
      engagement: sampleChartData.map(d => ({ ...d, value: d.value * 0.8 })),
      conversion: [
        { label: 'Visitors', value: 10000, color: '#3b82f6' },
        { label: 'Sign-ups', value: 2500, color: '#8b5cf6' },
        { label: 'Trials', value: 500, color: '#06b6d4' },
        { label: 'Customers', value: 200, color: '#10b981' }
      ]
    },
    topContent: [],
    recentActivity: []
  };

  const handleSearch = async (query: string) => {
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 1000));
    return sampleBusinesses.filter(b => 
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const tabs = [
    { id: 'components', label: 'Magic Components', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'animations', label: 'Animations', icon: <Zap className="h-4 w-4" /> },
    { id: 'visualization', label: 'Data Viz', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Heart className="h-4 w-4" /> }
  ];

  return (
    <PageTransition>
      <SkipToMain />
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        {/* Header */}
        <div className="miami-glass border-b border-white/20 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold miami-gradient-text">
                  Magic MCP Enterprise Components
                </h1>
                <p className="text-slate-600 mt-2">
                  Next-level UI components and interactions for enterprise applications
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Enterprise Grade
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setSelectedTab(tab.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div id="main-content">
            {selectedTab === 'components' && (
              <StaggeredList className="space-y-12">
                {/* Magic Buttons */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Magic Buttons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MagicButton variant="primary">
                        Primary Magic
                      </MagicButton>
                      <MagicLuxuryButton>
                        Luxury Magic
                      </MagicLuxuryButton>
                      <MagicGlassButton>
                        Glass Magic
                      </MagicGlassButton>
                      <MagicMetallicButton>
                        Metallic Magic
                      </MagicMetallicButton>
                    </div>
                  </CardContent>
                </Card>

                {/* Magic Search */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      AI-Powered Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MagicSearch
                      onSearch={handleSearch}
                      placeholder="Search businesses, products, locations..."
                      aiPowered={true}
                      voiceSearchEnabled={true}
                      categories={categories}
                    />
                  </CardContent>
                </Card>

                {/* Magic Data Table */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Interactive Data Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MagicDataTable
                      data={sampleTableData}
                      columns={tableColumns}
                      onExport={(data) => console.log('Exporting:', data)}
                    />
                  </CardContent>
                </Card>

                {/* Magic Form Wizard */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Form Wizard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MagicFormWizard
                      steps={[
                        {
                          id: 'step1',
                          title: 'Basic Information',
                          description: 'Enter your basic details',
                          component: ({ updateData }) => (
                            <div className="space-y-4">
                              <input
                                type="text"
                                placeholder="Name"
                                className="w-full p-3 border rounded-lg"
                                onChange={(e) => updateData({ name: e.target.value })}
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-3 border rounded-lg"
                                onChange={(e) => updateData({ email: e.target.value })}
                              />
                            </div>
                          )
                        },
                        {
                          id: 'step2',
                          title: 'Preferences',
                          description: 'Set your preferences',
                          component: ({ updateData }) => (
                            <div className="space-y-4">
                              <select
                                className="w-full p-3 border rounded-lg"
                                onChange={(e) => updateData({ preference: e.target.value })}
                              >
                                <option>Select preference</option>
                                <option>Option 1</option>
                                <option>Option 2</option>
                              </select>
                            </div>
                          )
                        }
                      ]}
                      onComplete={(data) => console.log('Wizard completed:', data)}
                    />
                  </CardContent>
                </Card>

                {/* Magic Carousel */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Interactive Carousel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MagicCarousel
                      items={carouselItems}
                      autoplay={true}
                      showThumbnails={true}
                      fullscreenEnabled={true}
                      downloadEnabled={true}
                      socialEnabled={true}
                      className="h-96"
                    />
                  </CardContent>
                </Card>

                {/* Magic Map */}
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Interactive Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MagicMap
                      markers={mapMarkers}
                      searchEnabled={true}
                      filterEnabled={true}
                      categories={categories}
                      className="h-96"
                    />
                  </CardContent>
                </Card>
              </StaggeredList>
            )}

            {selectedTab === 'animations' && (
              <StaggeredList className="space-y-12">
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Loading Animations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div className="text-center">
                        <LoadingSpinner variant="spinner" size="lg" />
                        <p className="mt-2 text-sm">Spinner</p>
                      </div>
                      <div className="text-center">
                        <LoadingSpinner variant="dots" size="lg" />
                        <p className="mt-2 text-sm">Dots</p>
                      </div>
                      <div className="text-center">
                        <LoadingSpinner variant="pulse" size="lg" />
                        <p className="mt-2 text-sm">Pulse</p>
                      </div>
                      <div className="text-center">
                        <LoadingSpinner variant="magic" size="lg" />
                        <p className="mt-2 text-sm">Magic</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle>Staggered Animations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-20 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg flex items-center justify-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="font-semibold">Item {i + 1}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </StaggeredList>
            )}

            {selectedTab === 'visualization' && (
              <StaggeredList className="space-y-12">
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Interactive Charts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <InteractiveChart
                        data={sampleChartData}
                        config={{
                          type: 'line',
                          showGrid: true,
                          showTooltip: true,
                          animated: true
                        }}
                        title="Revenue Growth"
                      />
                      <InteractiveChart
                        data={sampleChartData}
                        config={{
                          type: 'bar',
                          showGrid: true,
                          showTooltip: true,
                          animated: true
                        }}
                        title="Monthly Sales"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsDashboard
                      data={analyticsData}
                      timeRange="30d"
                      onTimeRangeChange={(range) => console.log('Time range changed:', range)}
                    />
                  </CardContent>
                </Card>
              </StaggeredList>
            )}

            {selectedTab === 'performance' && (
              <StaggeredList className="space-y-12">
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LazyImage className="h-5 w-5 text-primary" />
                      Lazy Loading Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <LazyImage
                          key={i}
                          src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`}
                          alt={`Sample image ${i + 1}`}
                          aspectRatio="square"
                          className="rounded-lg"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Virtual Scrolling
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VirtualBusinessList
                      businesses={[...sampleBusinesses, ...sampleBusinesses, ...sampleBusinesses]}
                      onBusinessClick={(business) => console.log('Business clicked:', business)}
                      className="h-96"
                    />
                  </CardContent>
                </Card>
              </StaggeredList>
            )}

            {selectedTab === 'accessibility' && (
              <StaggeredList className="space-y-12">
                <Card className="miami-glass miami-card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      Accessibility Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FocusTrap active={true}>
                      <div className="space-y-4">
                        <Button>Focusable Button 1</Button>
                        <Button>Focusable Button 2</Button>
                        <Button>Focusable Button 3</Button>
                      </div>
                    </FocusTrap>
                    
                    <div className="mt-6">
                      <LiveRegion message="This is a live region announcement" />
                      <Button 
                        onClick={() => {
                          const liveRegion = document.querySelector('[aria-live]');
                          if (liveRegion) {
                            liveRegion.textContent = 'Button clicked!';
                          }
                        }}
                      >
                        Test Live Region
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </StaggeredList>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="miami-glass border-t border-white/20 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h3 className="text-xl font-bold miami-gradient-text mb-2">
                Magic MCP Enterprise Components
              </h3>
              <p className="text-slate-600">
                Built with Framer Motion, TypeScript, and enterprise-grade accessibility
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
