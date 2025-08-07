import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PremiumFeatures = ({ darkTheme, currentUser }) => {
  const [premiumPlans, setPremiumPlans] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  useEffect(() => {
    fetchPremiumFeatures();
    fetchUserSubscription();
  }, []);

  const fetchPremiumFeatures = async () => {
    try {
      const response = await axios.get(`${API}/premium/features`);
      setPremiumPlans(response.data);
    } catch (error) {
      console.error('Error fetching premium features:', error);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        setUserSubscription({ is_premium: false, plan_type: 'free' });
        return;
      }

      const response = await axios.get(`${API}/premium/check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setUserSubscription({ is_premium: false, plan_type: 'free' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planType) => {
    // In a real implementation, this would integrate with Stripe/payment processor
    alert(`Upgrade to ${planType} plan coming soon! This would integrate with a payment processor like Stripe.`);
  };

  const PlanCard = ({ plan, planKey, isCurrentPlan = false, isPopular = false }) => (
    <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
      isCurrentPlan
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
        : isPopular
        ? 'border-red-500 bg-gradient-to-b from-red-50 to-white dark:from-red-900/20 dark:to-gray-900'
        : darkTheme
        ? 'border-gray-700 bg-gray-900 hover:border-gray-600'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-8">
        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className={`text-2xl font-bold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            {plan.name}
          </h3>
          <div className="mb-4">
            <span className={`text-4xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              ${plan.price}
            </span>
            <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              /month
            </span>
          </div>
          {plan.price_yearly && (
            <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="line-through">${(plan.price * 12).toFixed(2)}</span>
              <span className="ml-2 text-green-600 font-medium">
                ${plan.price_yearly}/year (Save ${((plan.price * 12) - plan.price_yearly).toFixed(2)})
              </span>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-sm ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Limits */}
        {plan.limits && (
          <div className={`p-4 rounded-lg mb-6 ${
            darkTheme ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h4 className={`font-medium mb-2 text-sm ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Plan Limits:
            </h4>
            <div className="space-y-1">
              {Object.entries(plan.limits).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {typeof value === 'string' ? value : value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => !isCurrentPlan && handleUpgrade(planKey)}
          disabled={isCurrentPlan}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isCurrentPlan
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : planKey === 'free_plan'
              ? darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : 
           planKey === 'free_plan' ? 'Current Plan' : 
           `Upgrade to ${plan.name}`}
        </button>
      </div>
    </div>
  );

  const PremiumBenefitsShowcase = () => (
    <div className={`p-8 rounded-2xl mb-8 ${
      darkTheme ? 'bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700' : 'bg-gradient-to-r from-gray-50 to-white border border-gray-200'
    }`}>
      <h3 className={`text-2xl font-bold text-center mb-8 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
        🚀 Unlock Premium Features
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkTheme ? 'bg-red-900/30' : 'bg-red-100'
          }`}>
            <span className="text-2xl">🎯</span>
          </div>
          <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Advanced Recommendations
          </h4>
          <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            AI-powered suggestions based on your unique taste profile and similar users
          </p>
        </div>

        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkTheme ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <span className="text-2xl">📊</span>
          </div>
          <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Advanced Analytics
          </h4>
          <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Detailed insights into your viewing habits and personalized statistics
          </p>
        </div>

        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkTheme ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <span className="text-2xl">🚫</span>
          </div>
          <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Ad-Free Experience
          </h4>
          <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Enjoy uninterrupted browsing without advertisements
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`animate-pulse p-8 rounded-2xl ${
          darkTheme ? 'bg-gray-900' : 'bg-gray-200'
        }`}>
          <div className="h-8 bg-current opacity-20 rounded mb-4" />
          <div className="h-4 bg-current opacity-20 rounded mb-2" />
          <div className="h-4 bg-current opacity-20 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-4xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          ⭐ Premium Plans
        </h2>
        <p className={`text-lg ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose the perfect plan for your entertainment discovery journey
        </p>
      </div>

      {/* Current Subscription Status */}
      {userSubscription && (
        <div className={`p-4 rounded-lg text-center ${
          userSubscription.is_premium
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        }`}>
          <p className="font-medium">
            {userSubscription.is_premium 
              ? `🎉 You're currently on the ${userSubscription.plan_type} plan!`
              : '🆓 You\'re currently on the free plan'
            }
          </p>
          {userSubscription.expires_at && (
            <p className="text-sm mt-1">
              Expires: {new Date(userSubscription.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Benefits Showcase */}
      {!userSubscription?.is_premium && <PremiumBenefitsShowcase />}

      {/* Pricing Plans */}
      {premiumPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanCard
            plan={premiumPlans.free_plan}
            planKey="free_plan"
            isCurrentPlan={userSubscription?.plan_type === 'free'}
          />
          <PlanCard
            plan={premiumPlans.premium_plan}
            planKey="premium_plan"
            isCurrentPlan={userSubscription?.plan_type === 'premium'}
            isPopular={true}
          />
          <PlanCard
            plan={premiumPlans.pro_plan}
            planKey="pro_plan"
            isCurrentPlan={userSubscription?.plan_type === 'pro'}
          />
        </div>
      )}

      {/* FAQ Section */}
      <div className={`p-8 rounded-2xl ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 text-center ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          💡 Frequently Asked Questions
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              Can I cancel my subscription anytime?
            </h4>
            <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until your current billing period ends.
            </p>
          </div>
          
          <div>
            <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              What payment methods do you accept?
            </h4>
            <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              We accept all major credit cards, PayPal, and other secure payment methods through our payment processor.
            </p>
          </div>
          
          <div>
            <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              Is there a free trial?
            </h4>
            <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              We offer a comprehensive free plan with core features. Premium plans include a 14-day money-back guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Have questions? <a href="#" className="text-red-500 hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  );
};

export default PremiumFeatures;