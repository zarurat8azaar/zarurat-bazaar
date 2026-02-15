import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import ComparisonView from './components/ComparisonView';
import StoreLocator from './components/StoreLocator';
import AIChat from './components/AIChat';
import AdminDashboard from './components/AdminDashboard';
import CommunicationHub from './components/CommunicationHub';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { Product, User, Service, CartItem, CompanyInfo } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { CATEGORIES } from './constants';

const App: React.FC = () => {
  // --- Global State ---
  const [activePage, setActivePage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(dataService.getCompanyInfo());

  // --- Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [storeLocations, setStoreLocations] = useState(dataService.getStoreLocations());

  // --- Navigation/Interaction State ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [searchCriteria, setSearchCriteria] = useState({ query: '', category: 'All' });
  const [showComparison, setShowComparison] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    // Load initial data
    refreshData();
    
    // Check for logged in user
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  const refreshData = () => {
    setProducts(dataService.getProducts());
    setServices(dataService.getServices());
    setCompanyInfo(dataService.getCompanyInfo());
    setStoreLocations(dataService.getStoreLocations());
  };

  // --- Handlers ---
  const handleNavigate = (page: string) => {
    setActivePage(page);
    window.scrollTo(0, 0);
    // Reset specific views
    if (page !== 'product-detail') setSelectedProduct(null);
    if (page !== 'compare') setShowComparison(false);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    handleNavigate('home');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    handleNavigate('home');
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
    window.scrollTo(0, 0);
  };

  const handleToggleCompare = (product: Product) => {
    setComparisonList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products at a time.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleSearch = (query: string, category: string) => {
    setSearchCriteria({ query, category });
    // If on home, allow Hero to trigger this but remain on home or switch to products?
    // Let's switch to a search results page or reuse 'new-products' with filters
    setActivePage('search-results');
    window.scrollTo(0, 0);
  };

  // --- Filtering Logic ---
  const getFilteredProducts = () => {
    let filtered = products;

    // Filter by Page Type
    if (activePage === 'new-products') {
      filtered = filtered.filter(p => p.condition === 'New');
    } else if (activePage === 'used-products') {
      filtered = filtered.filter(p => p.condition === 'Used');
    }

    // Filter by Search
    if (activePage === 'search-results' || searchCriteria.query) {
       if (searchCriteria.query) {
         const q = searchCriteria.query.toLowerCase();
         filtered = filtered.filter(p => 
           p.name.toLowerCase().includes(q) || 
           p.description.toLowerCase().includes(q) ||
           p.category.toLowerCase().includes(q)
         );
       }
       if (searchCriteria.category && searchCriteria.category !== 'All') {
         filtered = filtered.filter(p => p.category === searchCriteria.category);
       }
    }

    return filtered;
  };

  const currentFilteredProducts = getFilteredProducts();

  // --- Render Helpers ---
  const renderProductGrid = (items: Product[], title: string) => (
    <div className="container mx-auto px-4 py-8 animate-fade-in-up">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">{title}</h2>
      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 rounded-xl">
          <p className="text-xl text-gray-500">No products found matching your criteria.</p>
          <button onClick={() => { setSearchCriteria({query:'', category:'All'}); handleNavigate('home'); }} className="mt-4 text-primary-600 font-bold hover:underline">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
              onClick={handleProductClick}
              isSelected={comparisonList.some(p => p.id === product.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showComparison) {
      return (
        <ComparisonView 
          products={comparisonList} 
          onRemove={(id) => setComparisonList(prev => prev.filter(p => p.id !== id))}
          onAddToCart={handleAddToCart}
          onClose={() => setShowComparison(false)}
        />
      );
    }

    switch (activePage) {
      case 'home':
        const homeServices = services.filter(s => s.category === 'Services').slice(0, 4);
        const digitalServices = services.filter(s => s.category === 'Digital Services').slice(0, 4);
        const digitalProducts = products.filter(p => p.category === 'Digital Products').slice(0, 4);

        return (
          <>
            <Hero onShopNow={() => handleNavigate('new-products')} onSearch={handleSearch} />
            
            {/* Communication Hub Widget for Logged In Users */}
            {user && (
                <div className="container mx-auto px-4 -mt-10 relative z-20 mb-12">
                   <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
                               💬
                           </div>
                           <div>
                               <h2 className="text-xl font-bold text-gray-900">Communication Hub</h2>
                               <p className="text-gray-600 text-sm mt-1">
                                   Logged in as <span className="font-bold text-primary-700">{user.role}</span>.
                                   <br className="hidden md:block" />
                                   Access your organizational groups, chats, and meetings.
                               </p>
                           </div>
                       </div>
                       <button 
                           onClick={() => handleNavigate('groups')}
                           className="w-full md:w-auto bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                       >
                           Open Groups
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                           </svg>
                       </button>
                   </div>
                </div>
            )}

            {/* Featured New Products */}
            <div className="container mx-auto px-4 py-12">
              <div className="flex justify-between items-end mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Featured New Arrivals</h2>
                 <button onClick={() => handleNavigate('new-products')} className="text-primary-600 font-semibold hover:underline">View All &rarr;</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.filter(p => p.condition === 'New').slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} />
                ))}
              </div>
            </div>

            {/* Digital Products Zone (New Section) */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <span className="text-4xl">🖥️</span> Digital Products Zone
                            </h2>
                            <p className="text-gray-400">Latest Computers, Laptops, CCTVs, TVs & Accessories.</p>
                        </div>
                        <button 
                             onClick={() => { setSearchCriteria({query:'', category: 'Digital Products'}); handleNavigate('search-results'); }}
                             className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            Explore Digital Store
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {digitalProducts.map(p => (
                             <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Home Services Teaser */}
            <div className="bg-primary-50 py-12">
               <div className="container mx-auto px-4">
                 <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Expert Home Services</h2>
                    <p className="text-gray-600">From plumbing to interior design, we handle it all.</p>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {homeServices.map(s => (
                       <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('services')}>
                          <img src={s.image} alt={s.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{s.name}</h3>
                          <p className="text-xs text-gray-500">{s.priceRange}</p>
                       </div>
                    ))}
                 </div>
                 <div className="text-center mt-8">
                    <button onClick={() => handleNavigate('services')} className="bg-white border border-primary-600 text-primary-600 px-6 py-2 rounded-full font-bold hover:bg-primary-600 hover:text-white transition-colors">
                        Explore All Services
                    </button>
                 </div>
               </div>
            </div>

            {/* Digital Services Teaser */}
            <div className="bg-gray-900 text-white py-16">
               <div className="container mx-auto px-4">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                      <div>
                          <h2 className="text-3xl font-bold mb-2">Digital & Creative Solutions</h2>
                          <p className="text-gray-400">Scale your business with our cutting-edge digital services.</p>
                      </div>
                      <button onClick={() => handleNavigate('services')} className="bg-secondary-600 hover:bg-secondary-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                          View All Solutions
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {digitalServices.map(s => (
                          <div key={s.id} onClick={() => handleNavigate('services')} className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/20 transition-colors cursor-pointer group">
                              <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                  💻
                              </div>
                              <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{s.description}</p>
                              <div className="flex justify-between items-center text-xs font-bold text-secondary-400">
                                  <span>{s.priceRange}</span>
                                  <span>&rarr;</span>
                              </div>
                          </div>
                      ))}
                  </div>
               </div>
            </div>

            {/* Featured Used Products */}
            <div className="container mx-auto px-4 py-12">
              <div className="flex justify-between items-end mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Best Value Used Deals</h2>
                 <button onClick={() => handleNavigate('used-products')} className="text-primary-600 font-semibold hover:underline">View All &rarr;</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.filter(p => p.condition === 'Used').slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} />
                ))}
              </div>
            </div>
          </>
        );

      case 'new-products':
        return renderProductGrid(currentFilteredProducts, 'New Products');
      
      case 'used-products':
        return renderProductGrid(currentFilteredProducts, 'Used Market (Best Value)');
      
      case 'search-results':
        return renderProductGrid(currentFilteredProducts, `Search Results for "${searchCriteria.query}"`);

      case 'services':
        const homeServicesList = services.filter(s => s.category === 'Services');
        const digitalServicesList = services.filter(s => s.category === 'Digital Services');

        return (
          <div className="container mx-auto px-4 py-8 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600 mb-12 text-lg">Professional solutions for your home, lifestyle, and business needs.</p>
            
            {/* Digital Services Section */}
            <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Digital & Creative Services</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {digitalServicesList.map(service => (
                         <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all group">
                            <div className="h-48 bg-gray-900 relative overflow-hidden">
                                <img src={service.image} alt={service.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">💻</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                                <p className="text-sm text-gray-600 mb-4 flex-1">{service.description}</p>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                    <span className="font-bold text-secondary-600">{service.priceRange}</span>
                                    <button className="text-sm bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700">Enquire Now</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Home Services Section */}
            <div>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Home & Lifestyle Services</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {homeServicesList.map(service => (
                    <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gray-200">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 flex-1">{service.description}</p>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                            <span className="font-bold text-primary-700">{service.priceRange}</span>
                            <button className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">Book Now</button>
                        </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
          </div>
        );

      case 'stores':
        return <StoreLocator locations={storeLocations} />;

      case 'product-detail':
        return selectedProduct ? (
          <ProductDetail 
            product={selectedProduct} 
            onBack={() => handleNavigate('home')} 
            onAddToCart={handleAddToCart} 
          />
        ) : null;

      case 'cart':
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up">
                <h2 className="text-3xl font-bold mb-6">Your Cart</h2>
                {cart.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">Your cart is empty.</p>
                        <button onClick={() => handleNavigate('home')} className="text-primary-600 font-bold hover:underline">Start Shopping</button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {cart.map(item => (
                            <div key={item.id} className="p-4 border-b border-gray-100 flex gap-4 items-center">
                                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded bg-gray-100" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                                    <p className="text-sm text-gray-500">₹{item.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="font-medium">x {item.quantity}</div>
                                <div className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                        <div className="p-6 bg-gray-50 flex justify-between items-center">
                            <div className="text-lg">
                                Total: <span className="font-bold text-2xl">₹{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('en-IN')}</span>
                            </div>
                            <button 
                                onClick={() => { alert('Checkout functionality coming soon!'); setCart([]); }}
                                className="bg-secondary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-secondary-700 shadow-lg"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );

      case 'admin':
        return user && dataService.hasAdminAccess(user.role) ? (
            <AdminDashboard user={user} onUpdateProducts={refreshData} />
        ) : (
            <div className="text-center py-20 text-red-500 font-bold">Access Denied</div>
        );

      case 'auth':
        return <Auth onLogin={handleLogin} />;
      
      case 'groups':
        return user ? (
          <CommunicationHub user={user} />
        ) : <Auth onLogin={handleLogin} />;

      case 'profile':
        return user ? (
            <Profile user={user} onUpdateUser={setUser} onLogout={handleLogout} />
        ) : <Auth onLogin={handleLogin} />;

      case 'about':
        return (
            <div className="container mx-auto px-4 py-12 max-w-3xl text-center animate-fade-in-up">
                <h1 className="text-4xl font-bold text-primary-900 mb-6">{companyInfo.name}</h1>
                <p className="text-xl text-gray-600 mb-8">{companyInfo.tagline}</p>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-left space-y-4">
                    <p><strong>Parent Company:</strong> {companyInfo.parentCompany}</p>
                    <p><strong>Head Office:</strong> {companyInfo.headOffice}</p>
                    <p>
                        We are a hybrid marketplace dedicated to fulfilling the daily needs of our customers. 
                        Whether it's fresh groceries, premium furniture, reliable automobiles, or expert home services, 
                        <strong>Zarurat Bazaar</strong> brings it all to your fingertips.
                    </p>
                    <p>
                        Our unique model combines the ease of online shopping with the trust and reliability of our physical supermarket branches.
                    </p>
                </div>
            </div>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onNavigate={handleNavigate}
        activePage={activePage}
        user={user}
        onSearch={handleSearch}
        companyInfo={companyInfo}
      />

      <main className="flex-grow relative">
        {renderContent()}
      </main>

      {/* Comparison Floating Action Button */}
      {comparisonList.length > 0 && !showComparison && (
        <div className="fixed bottom-24 right-6 z-40 animate-bounce-small">
          <button 
            onClick={() => setShowComparison(true)}
            className="bg-primary-900 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-black transition-colors"
          >
            <span>Compare ({comparisonList.length})</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      )}

      <AIChat />

      {activePage !== 'groups' && (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">{companyInfo.name}</h3>
                        <p className="text-sm mb-4">A subsidiary of <br/><span className="text-white font-semibold">{companyInfo.parentCompany}</span></p>
                        <p className="text-xs text-gray-500">
                            {companyInfo.headOffice}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><button onClick={() => handleNavigate('home')} className="hover:text-white">Home</button></li>
                            <li><button onClick={() => handleNavigate('new-products')} className="hover:text-white">Products</button></li>
                            <li><button onClick={() => handleNavigate('services')} className="hover:text-white">Services</button></li>
                            <li><button onClick={() => handleNavigate('stores')} className="hover:text-white">Store Locator</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Customer Care</h4>
                        <ul className="space-y-2 text-sm">
                            <li><button className="hover:text-white">Track Order</button></li>
                            <li><button className="hover:text-white">Return Policy</button></li>
                            <li><button className="hover:text-white">FAQs</button></li>
                            <li><button className="hover:text-white">Privacy Policy</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Contact Us</h4>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {companyInfo.email}
                            </p>
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {companyInfo.phone}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
                </div>
            </div>
        </footer>
      )}
    </div>
  );
};

export default App;