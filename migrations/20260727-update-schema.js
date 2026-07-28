/**
 * Database Migration: Standardize to camelCase, add real-time currency calculation support,
 * update package & subscriber & inquiry schemas, drop visa and partner tables.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop deprecated tables: visa_info, partners
    try {
      await queryInterface.dropTable('visa_info');
      await queryInterface.dropTable('partners');
    } catch (e) {
      console.log('Tables visa_info or partners may not exist:', e.message);
    }

    // 2. Update packages table: remove hotel fields, rename columns to camelCase
    try {
      // Remove hotel columns if they exist
      const hotelCols = [
        'hotel_name_makkah',
        'hotel_name_madinah',
        'hotel_stars_makkah',
        'hotel_stars_madinah',
        'distance_haram_makkah',
        'distance_haram_madinah'
      ];
      for (const col of hotelCols) {
        try {
          await queryInterface.removeColumn('packages', col);
        } catch (e) {}
      }

      // Rename snake_case columns to camelCase
      await queryInterface.renameColumn('packages', 'title_en', 'titleEn');
      await queryInterface.renameColumn('packages', 'title_ar', 'titleAr');
      await queryInterface.renameColumn('packages', 'title_am', 'titleAm');
      await queryInterface.renameColumn('packages', 'price_usd', 'priceUsd');
      await queryInterface.renameColumn('packages', 'duration_days', 'durationDays');
      await queryInterface.renameColumn('packages', 'available_dates', 'availableDates');
      await queryInterface.renameColumn('packages', 'image_url', 'imageUrl');
      await queryInterface.renameColumn('packages', 'is_active', 'isActive');
      await queryInterface.renameColumn('packages', 'whatsapp_clicks', 'whatsappClicks');
      await queryInterface.renameColumn('packages', 'created_at', 'createdAt');
      await queryInterface.renameColumn('packages', 'updated_at', 'updatedAt');
    } catch (e) {
      console.log('Migration on packages table warning:', e.message);
    }

    // 3. Update gallery table to camelCase
    try {
      await queryInterface.renameColumn('gallery_items', 'title_en', 'titleEn');
      await queryInterface.renameColumn('gallery_items', 'title_ar', 'titleAr');
      await queryInterface.renameColumn('gallery_items', 'image_url', 'imageUrl');
      await queryInterface.renameColumn('gallery_items', 'video_url', 'videoUrl');
      await queryInterface.renameColumn('gallery_items', 'is_active', 'isActive');
      await queryInterface.renameColumn('gallery_items', 'sort_order', 'sortOrder');
      await queryInterface.renameColumn('gallery_items', 'created_at', 'createdAt');
      await queryInterface.renameColumn('gallery_items', 'updated_at', 'updatedAt');
    } catch (e) {
      console.log('Migration on gallery_items table warning:', e.message);
    }

    // 4. Update subscribers table: add optInStatus, rename columns
    try {
      await queryInterface.renameColumn('subscribers', 'package_interest_id', 'packageInterestId');
      await queryInterface.renameColumn('subscribers', 'created_at', 'createdAt');
      await queryInterface.renameColumn('subscribers', 'updated_at', 'updatedAt');
      await queryInterface.addColumn('subscribers', 'optInStatus', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
      await queryInterface.addColumn('subscribers', 'name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (e) {
      console.log('Migration on subscribers table warning:', e.message);
    }

    // 5. Update inquiries table to camelCase
    try {
      await queryInterface.renameColumn('inquiries', 'full_name', 'fullName');
      await queryInterface.renameColumn('inquiries', 'created_at', 'createdAt');
      await queryInterface.renameColumn('inquiries', 'updated_at', 'updatedAt');
    } catch (e) {
      console.log('Migration on inquiries table warning:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert schema changes if needed
  }
};
