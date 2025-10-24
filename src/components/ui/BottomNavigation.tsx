'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, QrCode, MapPin, User } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/history', icon: History, label: 'Riwayat' },
  { href: '/scan', icon: QrCode, label: 'Scan', isCenter: true },
  { href: '/locations', icon: MapPin, label: 'Lokasi' },
  { href: '/profile', icon: User, label: 'Profil' }
]

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="qr-scanner-button"
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex justify-center"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`nav-button ${isActive ? 'nav-button-active' : 'text-gray-500'}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 w-12 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}