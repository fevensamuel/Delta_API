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
      AdminUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-1' },
          username: { type: 'string', example: 'admin' },
          email: { type: 'string', example: 'admin@deltatravel.com' },
          role: { type: 'string', enum: ['SuperAdmin', 'Admin', 'Editor'], example: 'Admin' },
          isActive: { type: 'boolean', example: true },
          status: { type: 'string', example: 'Active' },
          lastLogin: { type: 'string', nullable: true },
          createdAt: { type: 'string' }
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
          user: { $ref: '#/components/schemas/AdminUser' }
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
    '/admin/gallery': {
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
    '/admin/users': {
      get: {
        summary: 'List all admin users (SuperAdmin only)',
        tags: ['Admin Users'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of admin users' } }
      },
      post: {
        summary: 'Create new admin user (SuperAdmin only)',
        tags: ['Admin Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'newadmin' },
                  email: { type: 'string', example: 'newadmin@deltatravel.com' },
                  password: { type: 'string', example: 'SecurePass123!' },
                  role: { type: 'string', enum: ['SuperAdmin', 'Admin', 'Editor'], example: 'Admin' },
                  status: { type: 'string', enum: ['Active', 'Inactive'], example: 'Active' }
                },
                required: ['username', 'email', 'password', 'role']
              }
            }
          }
        },
        responses: { 201: { description: 'Admin user created successfully' } }
      }
    },
    '/admin/users/{id}': {
      put: {
        summary: 'Update admin user (SuperAdmin only)',
        tags: ['Admin Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'updatedadmin' },
                  email: { type: 'string', example: 'updated@deltatravel.com' },
                  password: { type: 'string', example: 'NewSecurePass123!' },
                  role: { type: 'string', enum: ['SuperAdmin', 'Admin', 'Editor'] },
                  status: { type: 'string', enum: ['Active', 'Inactive'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Admin user updated successfully' } }
      },
      delete: {
        summary: 'Delete admin user (SuperAdmin only)',
        tags: ['Admin Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Admin user deleted successfully' } }
      }
    },
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