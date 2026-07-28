export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Delta Travel & Tour REST API',
    version: '2.0.0',
    description: 'REST API backend serving Umrah travel packages with real-time ETB exchange rate conversion, holy media gallery, SMS broadcasts, subscriber opt-ins, and customer inquiries.'
  },
  servers: [
    {
      url: '/api',
      description: 'Production / Local Server'
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
      }
    }
  },
  paths: {
    '/exchange-rate': {
      get: {
        summary: 'Get real-time USD to ETB exchange rate',
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
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Package details' } }
      }
    },
    '/packages/{id}/click-whatsapp': {
      post: {
        summary: 'Increment WhatsApp clicks for package',
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
    '/admin/packages': {
      post: {
        summary: 'Create package (USD price only stored)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created package' } }
      }
    },
    '/gallery': {
      get: {
        summary: 'List active gallery photos and videos',
        responses: { 200: { description: 'Gallery items' } }
      }
    },
    '/admin/gallery/bulk': {
      post: {
        summary: 'Bulk upload gallery photo/video items',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Bulk items created' } }
      }
    },
    '/subscribers': {
      post: {
        summary: 'Subscribe user for SMS updates',
        responses: { 201: { description: 'Subscribed successfully' } }
      }
    },
    '/admin/subscribers/bulk': {
      post: {
        summary: 'Bulk import subscribers',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Subscribers imported' } }
      }
    },
    '/inquiries': {
      post: {
        summary: 'Submit inquiry',
        responses: { 201: { description: 'Inquiry submitted' } }
      }
    },
    '/admin/sms/campaign': {
      post: {
        summary: 'Send broadcast SMS campaign with recipient filters',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'SMS campaign status',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  message: 'SMS campaign sent successfully',
                  data: {
                    recipientsCount: 150,
                    sentCount: 148,
                    failedCount: 2,
                    campaignId: 'camp_123456'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Standardized authentication login alias',
        responses: { 200: { description: 'Login successful with JWT token and user info' } }
      }
    },
    '/admin/login': {
      post: {
        summary: 'Standardized admin login',
        responses: { 200: { description: 'Login successful with JWT token and user info' } }
      }
    },
    '/admin/me': {
      get: {
        summary: 'Get current logged in user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current admin profile' } }
      }
    },
    '/admin/exchange-rate': {
      post: {
        summary: 'Admin override USD to ETB exchange rate',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Exchange rate updated successfully' } }
      }
    },
    '/admin/dashboard/stats': {
      get: {
        summary: 'Get administrative overview stats and analytics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard stats and recent activity' } }
      }
    },
    '/admin/sms/logs': {
      get: {
        summary: 'Get SMS logs history',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of sent SMS logs' } }
      }
    },
    '/admin/inquiries': {
      get: {
        summary: 'List all customer inquiries',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of inquiries' } }
      }
    },
    '/admin/inquiries/{id}/status': {
      put: {
        summary: 'Update inquiry status (New, Contacted, Resolved)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated inquiry status' } }
      }
    },
    '/admin/subscribers': {
      get: {
        summary: 'List all subscribers',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of subscribers' } }
      }
    },
    '/login': {
      post: {
        summary: 'Standardized admin login',
        responses: { 200: { description: 'Standardized auth payload' } }
      }
    }
  }
};
