'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Globe,
  Heart,
  Award,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import Header from '../../components/Header'

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('about')

  const tabs = [
    { id: 'about', label: 'About Us' },
    { id: 'mission', label: 'Our Mission' },
    { id: 'team', label: 'Our Team' },
    { id: 'values', label: 'Our Values' }
  ]

  const teamMembers = [
    { name: 'Aravinda Silva', position: 'Founder & CEO', image: '/placeholder-image.svg', bio: 'Passionate about showcasing Sri Lanka&apos;s beauty to the world.' },
    { name: 'Priya Fernando', position: 'Head of Operations', image: '/placeholder-image.svg', bio: 'Ensuring every journey is seamless and memorable.' },
    { name: 'Rajith Perera', position: 'Travel Curator', image: '/placeholder-image.svg', bio: 'Creating authentic experiences that connect travelers with local culture.' }
  ]

  const values = [
    {
      icon: '🌱',
      title: 'Sustainability',
      description: 'Committed to eco-friendly tourism and preserving Sri Lanka&apos;s natural beauty.'
    },
    {
      icon: '🤝',
      title: 'Authenticity',
      description: 'Providing genuine local experiences that go beyond typical tourist attractions.'
    },
    {
      icon: '💎',
      title: 'Quality',
      description: 'Delivering exceptional service and carefully curated travel experiences.'
    },
    {
      icon: '❤️',
      title: 'Passion',
      description: 'Driven by our love for Sri Lanka and desire to share its magic with the world.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-2">About ISLE & ECHO</h1>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto opacity-90 px-2">
            We&apos;re passionate about connecting travelers with the authentic beauty and rich culture of Sri Lanka
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 sm:py-6 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] touch-manipulation whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Our Story</h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Founded in 2020, ISLE & ECHO was born from a deep love for Sri Lanka and a desire to share its incredible beauty with the world. What started as a small local tour operation has grown into a trusted travel partner for thousands of visitors.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that travel should be more than just visiting places – it should be about experiencing cultures, connecting with people, and creating memories that last a lifetime. That&apos;s why we focus on authentic, sustainable tourism that benefits both our guests and the local communities.
              </p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
                  <div className="text-gray-600">Happy Travelers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                  <div className="text-gray-600">Destinations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
                  <div className="text-gray-600">Satisfaction Rate</div>
                </div>
              </div>
            </div>
            <div>
              <Image
                src="/placeholder-image.svg"
                alt="Sri Lanka Landscape"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Our Mission</h2>
            <p className="text-xl text-gray-600 mb-12">
              To inspire and enable travelers to discover the authentic beauty of Sri Lanka through sustainable, culturally immersive experiences that create lasting connections and positive impact.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Global Connection</h3>
                <p className="text-gray-600">Bridging cultures and connecting people from around the world with the heart of Sri Lanka.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Authentic Experiences</h3>
                <p className="text-gray-600">Creating genuine, meaningful experiences that go beyond typical tourist attractions.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Excellence</h3>
                <p className="text-gray-600">Delivering exceptional service and carefully curated experiences that exceed expectations.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <Image
                    src={member.image || '/placeholder-image.svg'}
                    alt={member.name}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'values' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <MapPin className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="text-gray-300">123 Travel Street, Colombo 01, Sri Lanka</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-gray-300">+94 11 234 5678</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-gray-300">hello@isleandecho.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
