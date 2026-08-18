// swagger.ts
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Delta Travel & Tour REST API',
    version: '2.0.0',
    description: 'REST API backend serving Umrah travel packages with real-time ETB exchange rate conversion, holy media gallery, SMS broadcasts, subscriber opt-ins, and customer inquiries.'
  },
  servers: [
    {
      url: 'https://delta-travel-backend.onrender.com',
      description: '🚀 Production Server (Primary)'
    },
    {
      url: 'http://localhost:3000',
      description: '🛠️ Local Development Server'
    },
    {
      url: '/api',
      description: 'Relative API Path (if served from same domain)'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ExchangeRate: {
        type: 'object',
        properties: {
          rate: { type: 'number', example: 159.98 },
          updatedAt: { type: 'string', example: '2026-07-27T17:50:00Z' },
          source: { type: 'string', example: 'budjet.org' },
          isFallback: { type: 'boolean', example: false }
        }
      },
      Package: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pkg-1' },
          titleEn: { type: 'string', example: 'Economy Saver Umrah Package' },
          titleAr: { type: 'string', example: 'باقة العمرة الاقتصادية' },
          titleAm: { type: 'string', example: 'የኢኮኖሚ ዑምራ ፓኬጅ' },
          category: { type: 'string', enum: ['Economy', 'Standard', 'Premium', 'VIP'] },
          priceUsd: { type: 'number', example: 890 },
          priceEtb: { type: 'number', example: 99780 },
          durationDays: { type: 'integer', example: 10 },
          departureCity: { type: 'string', example: 'Addis Ababa' },
          inclusions: { type: 'array', items: { type: 'string' } },
          availableDates: { type: 'array', items: { type: 'string' } },
          imageUrl: { type: 'string' },
          isActive: { type: 'boolean', example: true },
          whatsappClicks: { type: 'integer', example: 34 },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      GalleryItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'gal-1' },
          type: { type: 'string', enum: ['photo', 'video'] },
          titleEn: { type: 'string', example: 'Holy Kaaba & Mataf Courtyard' },
          titleAr: { type: 'string', example: 'الكعبة المشرفة والصحن الشريف' },
          imageUrl: { type: 'string' },
          videoUrl: { type: 'string' },
          duration: { type: 'string', example: '3:45' },
          location: { type: 'string', example: 'Masjid al-Haram, Makkah' },
          description: { type: 'string' },
          isActive: { type: 'boolean', example: true },
          sortOrder: { type: 'integer', example: 1 },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      Subscriber: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sub-1' },
          phone: { type: 'string', example: '+251911223344' },
          email: { type: 'string', example: 'subscriber@example.com' },
          name: { type: 'string', example: 'Abebe Bikila' },
          channel: { type: 'string', example: 'Footer Newsletter' },
          packageInterestId: { type: 'string', example: 'pkg-1' },
          optInStatus: { type: 'boolean', example: true },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      Inquiry: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'inq-1' },
          fullName: { type: 'string', example: 'Mohammed Ahmed' },
          phone: { type: 'string', example: '+251922334455' },
          email: { type: 'string', example: 'mohammed@example.com' },
          subject: { type: 'string', example: 'Group Booking' },
          message: { type: 'string' },
          source: { type: 'string', example: 'Contact Form' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Resolved'], example: 'New' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      FAQ: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'faq-1' },
          question: { type: 'string', example: 'What is included in the Umrah package?' },
          answer: { type: 'string', example: 'Our Umrah packages include visa processing, round-trip flights, hotel accommodation, transportation, and a dedicated tour guide (Ustaz).' }
        }
      },
      SocialLink: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sl-1' },
          platform: { type: 'string', example: 'facebook' },
          url: { type: 'string', example: 'https://facebook.com/deltatravel' },
          isActive: { type: 'boolean', example: true },
          icon: { type: 'string', example: 'Facebook' }
        }
      },
      TeamMember: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tm-1' },
          name: { type: 'string', example: 'Sheikh Omar Al-Hassan' },
          role: { type: 'string', example: 'Head Mutawwif & Islamic Scholar' },
          bio: { type: 'string', example: '12+ years leading Tawaf and Sa\'i rituals' },
          imageUrl: { type: 'string', example: '/uploads/team/image.jpg' },
          order: { type: 'integer', example: 1 },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      LoginRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'admin@deltatravel.com' },
          password: { type: 'string', example: 'admin123' }
        },
        required: ['username', 'password']
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', example: 'Admin' },
              isActive: { type: 'boolean' },
              status: { type: 'string' }
            }
          }
        }
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalPackages: { type: 'integer', example: 12 },
          activePackages: { type: 'integer', example: 8 },
          totalGalleryItems: { type: 'integer', example: 45 },
          totalInquiries: { type: 'integer', example: 67 },
          totalSubscribers: { type: 'integer', example: 234 },
          totalWhatsappClicks: { type: 'integer', example: 89 },
          smsSentThisMonth: { type: 'integer', example: 45 },
          clicksByCategory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', example: 'Economy' },
                clicks: { type: 'integer', example: 34 }
              }
            }
          },
          recentInquiries: {
            type: 'array',
            items: { $ref: '#/components/schemas/Inquiry' }
          },
          recentGalleryUploads: {
            type: 'array',
            items: { $ref: '#/components/schemas/GalleryItem' }
          }
        }
      }
    }
  },
  paths: {
    // ============================================================
    // PUBLIC ENDPOINTS
    // ============================================================
    '/exchange-rate': {
      get: {
        summary: 'Get real-time USD to ETB exchange rate',
        tags: ['Public'],
        responses: {
          200: {
            description: 'Success real-time rate',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  data: {
                    rate: 112.11,
                    updatedAt: '2026-07-27T10:00:00Z',
                    source: 'budjet.org'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/packages': {
      get: {
        summary: 'List active Umrah packages (with real-time ETB prices)',
        tags: ['Public'],
        responses: {
          200: {
            description: 'List of packages',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  count: 4,
                  data: [
                    {
                      id: 'pkg-1',
                      titleEn: 'Economy Saver Umrah Package',
                      titleAr: 'باقة العمرة الاقتصادية',
                      category: 'Economy',
                      priceUsd: 890,
                      priceEtb: 99780,
                      durationDays: 10,
                      isActive: true,
                      whatsappClicks: 34
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/packages/{id}': {
      get: {
        summary: 'Get package details by ID',
        tags: ['Public'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Package details' } }
      }
    },
    '/packages/{id}/click-whatsapp': {
      post: {
        summary: 'Increment WhatsApp clicks for package',
        tags: ['Public'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Updated click count',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: { whatsappClicks: 35 }
                }
              }
            }
          }
        }
      }
    },
    '/gallery': {
      get: {
        summary: 'List active gallery photos and videos',
        tags: ['Public'],
        responses: { 200: { description: 'Gallery items' } }
      }
    },
    '/gallery/{id}': {
      get: {
        summary: 'Get gallery item by ID',
        tags: ['Public'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gallery item details' } }
      }
    },
    '/faqs': {
      get: {
        summary: 'Get all active FAQs',
        tags: ['Public'],
        responses: {
          200: {
            description: 'List of FAQs',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  count: 5,
                  data: [
                    {
                      id: 'faq-1',
                      question: 'What is included in the Umrah package?',
                      answer: 'Our Umrah packages include visa processing, round-trip flights, hotel accommodation, transportation, and a dedicated tour guide (Ustaz).'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/social-links': {
      get: {
        summary: 'Get all active social media links',
        tags: ['Public'],
        responses: {
          200: {
            description: 'List of social links',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  data: [
                    {
                      id: 'sl-1',
                      platform: 'facebook',
                      url: 'https://facebook.com/deltatravel',
                      isActive: true,
                      icon: 'Facebook'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/team-members': {
      get: {
        summary: 'Get all active team members',
        tags: ['Public'],
        responses: {
          200: {
            description: 'List of team members',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  count: 3,
                  data: [
                    {
                      id: 'tm-1',
                      name: 'Sheikh Omar Al-Hassan',
                      role: 'Head Mutawwif & Islamic Scholar',
                      bio: '12+ years leading Tawaf and Sa\'i rituals; graduate of Islamic University of Madinah.',
                      imageUrl: '/uploads/team/image.jpg',
                      order: 1,
                      isActive: true
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/subscribers': {
      post: {
        summary: 'Subscribe user for SMS updates',
        tags: ['Public'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string', example: '+251911223344' },
                  email: { type: 'string', example: 'subscriber@example.com' },
                  name: { type: 'string', example: 'Abebe Bikila' },
                  channel: { type: 'string', example: 'Footer Newsletter' },
                  packageInterestId: { type: 'string', example: 'pkg-1' }
                },
                required: ['phone']
              }
            }
          }
        },
        responses: { 201: { description: 'Subscribed successfully' } }
      }
    },
    '/inquiries': {
      post: {
        summary: 'Submit inquiry',
        tags: ['Public'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Mohammed Ahmed' },
                  phone: { type: 'string', example: '+251922334455' },
                  email: { type: 'string', example: 'mohammed@example.com' },
                  subject: { type: 'string', example: 'Group Booking' },
                  message: { type: 'string', example: 'I want to book for 5 people' },
                  source: { type: 'string', example: 'Contact Form' }
                },
                required: ['fullName', 'phone', 'message']
              }
            }
          }
        },
        responses: { 201: { description: 'Inquiry submitted' } }
      }
    },

    // ============================================================
    // ADMIN AUTH ENDPOINTS
    // ============================================================
    '/admin/auth/login': {
      post: {
        summary: 'Admin Authentication Login',
        tags: ['Admin Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful with JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          }
        }
      }
    },
    '/admin/auth/me': {
      get: {
        summary: 'Get current admin user profile',
        tags: ['Admin Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current admin user profile' } }
      }
    },

    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================
    '/admin/dashboard/stats': {
      get: {
        summary: 'Get administrative overview stats and analytics',
        tags: ['Admin Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard stats and recent activity',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStats' }
              }
            }
          }
        }
      }
    },

    // ============================================================
    // ADMIN PACKAGES
    // ============================================================
    '/admin/packages': {
      get: {
        summary: 'List all packages (admin view)',
        tags: ['Admin Packages'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of all packages' } }
      },
      post: {
        summary: 'Create new package (USD price only)',
        tags: ['Admin Packages'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  titleEn: { type: 'string', example: 'Premium Umrah Package' },
                  titleAr: { type: 'string', example: 'باقة العمرة الممتازة' },
                  titleAm: { type: 'string', example: 'ፕሪሚየም ዑምራ ፓኬጅ' },
                  category: { type: 'string', enum: ['Economy', 'Standard', 'Premium', 'VIP'] },
                  priceUsd: { type: 'number', example: 1200 },
                  durationDays: { type: 'integer', example: 12 },
                  departureCity: { type: 'string', example: 'Addis Ababa' },
                  inclusions: { type: 'string', example: '["Hotel","Flight","Transport"]' },
                  availableDates: { type: 'string', example: '["2026-12-01","2026-12-15"]' },
                  itinerary: { type: 'string', example: '[{"day":1,"description":"Arrival"}]' },
                  isActive: { type: 'boolean', example: true },
                  packageImage: { type: 'string', format: 'binary' }
                },
                required: ['titleEn', 'category', 'priceUsd', 'durationDays']
              }
            }
          }
        },
        responses: { 201: { description: 'Package created successfully' } }
      }
    },
    '/admin/packages/{id}': {
      get: {
        summary: 'Get package by ID (admin view)',
        tags: ['Admin Packages'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Package details' } }
      },
      put: {
        summary: 'Update package',
        tags: ['Admin Packages'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Package updated successfully' } }
      },
      delete: {
        summary: 'Delete package',
        tags: ['Admin Packages'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Package deleted successfully' } }
      }
    },

    // ============================================================
    // ADMIN GALLERY
    // ============================================================
    '/admin/gallery': {
      get: {
        summary: 'List all gallery items (admin view)',
        tags: ['Admin Gallery'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of all gallery items' } }
      },
      post: {
        summary: 'Upload single gallery item (photo or video)',
        tags: ['Admin Gallery'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['photo', 'video'] },
                  titleEn: { type: 'string', example: 'Holy Kaaba' },
                  titleAr: { type: 'string', example: 'الكعبة المشرفة' },
                  location: { type: 'string', example: 'Masjid al-Haram, Makkah' },
                  description: { type: 'string' },
                  duration: { type: 'string', example: '3:45' },
                  isActive: { type: 'boolean', example: true },
                  image: { type: 'string', format: 'binary' },
                  video: { type: 'string', format: 'binary' }
                },
                required: ['type', 'titleEn']
              }
            }
          }
        },
        responses: { 201: { description: 'Gallery item created successfully' } }
      }
    },
    '/admin/gallery/bulk': {
      post: {
        summary: 'Bulk upload gallery items (photos and videos)',
        tags: ['Admin Gallery'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'string',
                    example: '[{"titleEn":"Mecca","type":"photo"},{"titleEn":"Medina","type":"photo"}]'
                  },
                  files: { type: 'array', items: { type: 'string', format: 'binary' } }
                },
                required: ['items']
              }
            }
          }
        },
        responses: { 201: { description: 'Bulk items created' } }
      }
    },
    '/admin/gallery/{id}': {
      put: {
        summary: 'Update gallery item',
        tags: ['Admin Gallery'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gallery item updated successfully' } }
      },
      delete: {
        summary: 'Delete gallery item',
        tags: ['Admin Gallery'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gallery item deleted successfully' } }
      }
    },

    // ============================================================
    // ADMIN INQUIRIES
    // ============================================================
    '/admin/inquiries': {
      get: {
        summary: 'List all customer inquiries',
        tags: ['Admin Inquiries'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of inquiries' } }
      }
    },
    '/admin/inquiries/{id}': {
      put: {
        summary: 'Update inquiry status',
        tags: ['Admin Inquiries'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['New', 'Contacted', 'Resolved'], example: 'Contacted' }
                },
                required: ['status']
              }
            }
          }
        },
        responses: { 200: { description: 'Updated inquiry status' } }
      }
    },

    // ============================================================
    // ADMIN SUBSCRIBERS
    // ============================================================
    '/admin/subscribers': {
      get: {
        summary: 'List all subscribers',
        tags: ['Admin Subscribers'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of subscribers' } }
      }
    },
    '/admin/subscribers/bulk': {
      post: {
        summary: 'Bulk import subscribers',
        tags: ['Admin Subscribers'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  subscribers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        phone: { type: 'string', example: '+251911223344' },
                        email: { type: 'string', example: 'user@example.com' },
                        name: { type: 'string', example: 'Abebe Bikila' },
                        channel: { type: 'string', example: 'Bulk Import' }
                      },
                      required: ['phone']
                    }
                  }
                },
                required: ['subscribers']
              }
            }
          }
        },
        responses: { 201: { description: 'Subscribers imported' } }
      }
    },
    '/admin/subscribers/bulk-delete': {
      delete: {
        summary: 'Bulk delete subscribers by IDs or phone numbers',
        tags: ['Admin Subscribers'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ids: { type: 'array', items: { type: 'string' }, example: ['sub-1', 'sub-2'] },
                  phoneNumbers: { type: 'array', items: { type: 'string' }, example: ['+251911223344'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Subscribers deleted' } }
      }
    },

    // ============================================================
    // ADMIN SMS
    // ============================================================
    '/admin/sms/campaign': {
      post: {
        summary: 'Send SMS campaign with recipient filters',
        tags: ['Admin SMS'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Your Umrah package is ready!' },
                  sendToAll: { type: 'boolean', example: true },
                  recipientFilter: { type: 'string', example: 'channel:Web Form' },
                  channelFilter: { type: 'string', example: 'Web Form' },
                  packageInterestId: { type: 'string', example: 'pkg-1' }
                },
                required: ['message']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'SMS campaign status',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  success: true,
                  message: 'SMS campaign sent successfully',
                  data: {
                    recipientsCount: 150,
                    sentCount: 148,
                    failedCount: 2,
                    campaignId: 'camp_1734567890123',
                    sentAt: '2026-07-27T10:00:00Z',
                    status: 'Delivered'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/sms/logs': {
      get: {
        summary: 'Get SMS logs history',
        tags: ['Admin SMS'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of sent SMS logs' } }
      }
    },
    '/admin/sms/campaigns': {
      get: {
        summary: 'Get SMS campaign logs',
        tags: ['Admin SMS'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of SMS campaigns' } }
      }
    },

    // ============================================================
    // ADMIN EXCHANGE RATE
    // ============================================================
    '/admin/exchange-rate': {
      get: {
        summary: 'Get exchange rate for admin dashboard',
        tags: ['Admin Exchange Rate'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Exchange rate details' } }
      },
      post: {
        summary: 'Override USD to ETB exchange rate',
        tags: ['Admin Exchange Rate'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rate: { type: 'number', example: 160.50 }
                },
                required: ['rate']
              }
            }
          }
        },
        responses: { 200: { description: 'Exchange rate updated successfully' } }
      }
    },

    // ============================================================
    // ADMIN FAQS
    // ============================================================
    '/admin/faqs': {
      get: {
        summary: 'Get all FAQs (admin view)',
        tags: ['Admin FAQs'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all FAQs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 5 },
                    data: { type: 'array', items: { $ref: '#/components/schemas/FAQ' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new FAQ',
        tags: ['Admin FAQs'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: { type: 'string', example: 'What is the best time for Umrah?' },
                  answer: { type: 'string', example: 'The best time is during the cooler months from November to March.' }
                },
                required: ['question', 'answer']
              }
            }
          }
        },
        responses: { 201: { description: 'FAQ created successfully' } }
      }
    },
    '/admin/faqs/{id}': {
      put: {
        summary: 'Update an existing FAQ',
        tags: ['Admin FAQs'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: { type: 'string', example: 'Updated question?' },
                  answer: { type: 'string', example: 'Updated answer.' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'FAQ updated successfully' } }
      },
      delete: {
        summary: 'Delete an FAQ',
        tags: ['Admin FAQs'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'FAQ deleted successfully' } }
      }
    },

    // ============================================================
    // ADMIN SOCIAL LINKS
    // ============================================================
    '/admin/social-links': {
      get: {
        summary: 'Get all social links (admin view)',
        tags: ['Admin Social Links'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all social links',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/SocialLink' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new social link',
        tags: ['Admin Social Links'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  platform: { type: 'string', example: 'youtube' },
                  url: { type: 'string', example: 'https://youtube.com/deltatravel' },
                  isActive: { type: 'boolean', example: true }
                },
                required: ['platform', 'url']
              }
            }
          }
        },
        responses: { 201: { description: 'Social link created successfully' } }
      }
    },
    '/admin/social-links/{id}': {
      put: {
        summary: 'Update a social link',
        tags: ['Admin Social Links'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://youtube.com/deltatravel' },
                  isActive: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Social link updated successfully' } }
      },
      delete: {
        summary: 'Delete a social link',
        tags: ['Admin Social Links'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Social link deleted successfully' } }
      }
    },

    // ============================================================
    // ADMIN TEAM MEMBERS
    // ============================================================
    '/admin/team-members': {
      get: {
        summary: 'Get all team members (admin view)',
        tags: ['Admin Team Members'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of all team members',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 3 },
                    data: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new team member with image upload',
        tags: ['Admin Team Members'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Sheikh Omar Al-Hassan' },
                  role: { type: 'string', example: 'Head Mutawwif & Islamic Scholar' },
                  bio: { type: 'string', example: '12+ years leading Tawaf and Sa\'i rituals.' },
                  order: { type: 'integer', example: 1 },
                  isActive: { type: 'boolean', example: true },
                  image: { type: 'string', format: 'binary', description: 'Team member photo (JPG, PNG, WEBP)' }
                },
                required: ['name', 'role', 'bio', 'image']
              }
            }
          }
        },
        responses: { 201: { description: 'Team member created successfully' } }
      }
    },
    '/admin/team-members/{id}': {
      put: {
        summary: 'Update a team member with optional image upload',
        tags: ['Admin Team Members'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Updated Name' },
                  role: { type: 'string', example: 'Updated Role' },
                  bio: { type: 'string', example: 'Updated bio.' },
                  order: { type: 'integer', example: 2 },
                  isActive: { type: 'boolean', example: true },
                  image: { type: 'string', format: 'binary', description: 'New team member photo (optional)' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Team member updated successfully' } }
      },
      delete: {
        summary: 'Delete a team member',
        tags: ['Admin Team Members'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Team member deleted successfully' } }
      }
    },

    // ============================================================
    // LEGACY ENDPOINTS (Aliases)
    // ============================================================
    '/login': {
      post: {
        summary: 'Standardized admin login (alias)',
        tags: ['Legacy'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: { 200: { description: 'Login successful' } }
      }
    },
    '/admin/login': {
      post: {
        summary: 'Admin login (alias)',
        tags: ['Legacy'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: { 200: { description: 'Login successful' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Standardized auth login (alias)',
        tags: ['Legacy'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: { 200: { description: 'Login successful' } }
      }
    },
    '/admin/me': {
      get: {
        summary: 'Get current admin user (alias)',
        tags: ['Legacy'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current admin profile' } }
      }
    },
    '/admin/inquiries/{id}/status': {
      put: {
        summary: 'Update inquiry status (alias)',
        tags: ['Legacy'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['New', 'Contacted', 'Resolved'] }
                },
                required: ['status']
              }
            }
          }
        },
        responses: { 200: { description: 'Updated inquiry status' } }
      }
    },
    '/admin/subscribers/bulk-import': {
      post: {
        summary: 'Bulk import subscribers (alias)',
        tags: ['Legacy'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Subscribers imported' } }
      }
    }
  }
};