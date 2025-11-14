import { getProfilePhotoUrl, getLocationDisplay } from '../profileHelpers';

describe('profileHelpers', () => {
  describe('getProfilePhotoUrl', () => {
    /**
     * Test: Cloudinary URL (https) should be returned unchanged
     * Requirements: 1.1, 1.2
     */
    test('returns Cloudinary HTTPS URL unchanged', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      const result = getProfilePhotoUrl(cloudinaryUrl);
      expect(result).toBe(cloudinaryUrl);
    });

    /**
     * Test: Cloudinary URL (http) should be returned unchanged
     * Requirements: 1.1, 1.2
     */
    test('returns Cloudinary HTTP URL unchanged', () => {
      const cloudinaryUrl = 'http://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      const result = getProfilePhotoUrl(cloudinaryUrl);
      expect(result).toBe(cloudinaryUrl);
    });

    /**
     * Test: Relative path should have /storage/ prepended
     * Requirements: 1.3
     */
    test('prepends /storage/ to relative path', () => {
      const relativePath = 'profile-photos/user123.jpg';
      const result = getProfilePhotoUrl(relativePath);
      expect(result).toBe('/storage/profile-photos/user123.jpg');
    });

    /**
     * Test: Null value should return null
     * Requirements: 1.1, 1.2, 1.3
     */
    test('returns null when profilePhoto is null', () => {
      const result = getProfilePhotoUrl(null);
      expect(result).toBeNull();
    });

    /**
     * Test: Undefined value should return null
     * Requirements: 1.1, 1.2, 1.3
     */
    test('returns null when profilePhoto is undefined', () => {
      const result = getProfilePhotoUrl(undefined);
      expect(result).toBeNull();
    });

    /**
     * Test: Empty string should return null
     * Requirements: 1.1, 1.2, 1.3
     */
    test('returns null when profilePhoto is empty string', () => {
      const result = getProfilePhotoUrl('');
      expect(result).toBeNull();
    });

    /**
     * Test: Path with leading slash should have /storage/ prepended
     * Requirements: 1.3
     */
    test('prepends /storage/ to path with leading slash', () => {
      const pathWithSlash = '/profile-photos/user123.jpg';
      const result = getProfilePhotoUrl(pathWithSlash);
      expect(result).toBe('/storage//profile-photos/user123.jpg');
    });
  });

  describe('getLocationDisplay', () => {
    /**
     * Test: User with barangay should return barangay only
     * Requirements: 2.1, 2.2
     */
    test('returns barangay when user has barangay', () => {
      const user = { barangay: 'Maribago' };
      const result = getLocationDisplay(user);
      expect(result).toBe('Maribago');
    });

    /**
     * Test: User without barangay should return null
     * Requirements: 2.1, 2.3
     */
    test('returns null when user has no barangay', () => {
      const user = { name: 'John Doe' };
      const result = getLocationDisplay(user);
      expect(result).toBeNull();
    });

    /**
     * Test: Null user should return null
     * Requirements: 2.1, 2.3
     */
    test('returns null when user is null', () => {
      const result = getLocationDisplay(null);
      expect(result).toBeNull();
    });

    /**
     * Test: Undefined user should return null
     * Requirements: 2.1, 2.3
     */
    test('returns null when user is undefined', () => {
      const result = getLocationDisplay(undefined);
      expect(result).toBeNull();
    });

    /**
     * Test: User with empty string barangay should return null
     * Requirements: 2.1, 2.3
     */
    test('returns null when barangay is empty string', () => {
      const user = { barangay: '' };
      const result = getLocationDisplay(user);
      expect(result).toBeNull();
    });

    /**
     * Test: User with null barangay should return null
     * Requirements: 2.1, 2.3
     */
    test('returns null when barangay is null', () => {
      const user = { barangay: null };
      const result = getLocationDisplay(user);
      expect(result).toBeNull();
    });

    /**
     * Test: User with barangay and other properties should return barangay only
     * Requirements: 2.1, 2.2
     */
    test('returns only barangay when user has multiple properties', () => {
      const user = {
        id: 1,
        name: 'John Doe',
        barangay: 'Basak',
        city: 'Lapu-Lapu City',
        country: 'Philippines'
      };
      const result = getLocationDisplay(user);
      expect(result).toBe('Basak');
    });
  });
});
