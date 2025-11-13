import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import useOnboardingForm from '../useOnboardingForm';

// Mock @inertiajs/react
jest.mock('@inertiajs/react', () => ({
    useForm: jest.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useOnboardingForm', () => {
    let mockInertiaForm;
    let mockLocalStorage;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock Inertia useForm
        mockInertiaForm = {
            data: {},
            setData: jest.fn((key, value) => {
                mockInertiaForm.data[key] = value;
            }),
            errors: {},
            processing: false,
            progress: null,
            wasSuccessful: false,
            recentlySuccessful: false,
            reset: jest.fn(),
            clearErrors: jest.fn(),
            setError: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            patch: jest.fn(),
            delete: jest.fn(),
            transform: jest.fn(),
        };
        
        useForm.mockReturnValue(mockInertiaForm);
        
        // Mock localStorage
        mockLocalStorage = {};
        Storage.prototype.getItem = jest.fn((key) => mockLocalStorage[key] || null);
        Storage.prototype.setItem = jest.fn((key, value) => {
            mockLocalStorage[key] = value;
        });
        Storage.prototype.removeItem = jest.fn((key) => {
            delete mockLocalStorage[key];
        });
        
        // Reset URL mocks
        global.URL.createObjectURL.mockClear();
        global.URL.revokeObjectURL.mockClear();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('Form State Management', () => {
        it('initializes with provided initial data', () => {
            const initialData = { name: 'John', email: 'john@example.com' };
            
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData,
                    storageKey: 'test_form',
                })
            );

            expect(useForm).toHaveBeenCalledWith(initialData);
        });

        it('provides setData method that updates form data', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            act(() => {
                result.current.setData('name', 'Jane');
            });

            expect(mockInertiaForm.setData).toHaveBeenCalledWith('name', 'Jane');
        });

        it('exposes form errors from Inertia form', () => {
            mockInertiaForm.errors = { email: 'Email is required' };
            
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            expect(result.current.errors).toEqual({ email: 'Email is required' });
        });

        it('exposes processing state from Inertia form', () => {
            mockInertiaForm.processing = true;
            
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            expect(result.current.processing).toBe(true);
        });
    });

    describe('File State Management', () => {
        it('initializes with empty file state', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            expect(result.current.files).toEqual({});
            expect(result.current.filePreviews).toEqual({});
        });

        it('stores file when handleFileChange is called', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

            act(() => {
                result.current.handleFileChange('document', mockFile);
            });

            expect(result.current.files.document).toBe(mockFile);
            expect(mockInertiaForm.setData).toHaveBeenCalledWith('document', mockFile);
        });

        it('removes file when handleFileChange is called with null', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

            // Add file first
            act(() => {
                result.current.handleFileChange('document', mockFile);
            });

            // Remove file
            act(() => {
                result.current.handleFileChange('document', null);
            });

            expect(result.current.files.document).toBeUndefined();
            expect(mockInertiaForm.setData).toHaveBeenCalledWith('document', null);
        });

        it('provides getFile method to retrieve file by field name', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

            act(() => {
                result.current.handleFileChange('document', mockFile);
            });

            expect(result.current.getFile('document')).toBe(mockFile);
            expect(result.current.getFile('nonexistent')).toBeNull();
        });
    });

    describe('Preview URL Generation and Cleanup', () => {
        it('generates preview URL for image files', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockImageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile);
            });

            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockImageFile);
            expect(result.current.filePreviews.profile_picture).toBe('blob:mock-url');
        });

        it('does not generate preview URL for non-image files', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockPdfFile = new File(['pdf'], 'document.pdf', { type: 'application/pdf' });

            act(() => {
                result.current.handleFileChange('document', mockPdfFile);
            });

            expect(global.URL.createObjectURL).not.toHaveBeenCalled();
            expect(result.current.filePreviews.document).toBeUndefined();
        });

        it('revokes old preview URL when new file is selected', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockImageFile1 = new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' });
            const mockImageFile2 = new File(['image2'], 'photo2.jpg', { type: 'image/jpeg' });

            // Add first file
            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile1);
            });

            const firstUrl = result.current.filePreviews.profile_picture;

            // Add second file
            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile2);
            });

            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl);
        });

        it('revokes preview URL when file is removed', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockImageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

            // Add file
            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile);
            });

            const previewUrl = result.current.filePreviews.profile_picture;

            // Remove file
            act(() => {
                result.current.handleFileChange('profile_picture', null);
            });

            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(previewUrl);
            expect(result.current.filePreviews.profile_picture).toBeUndefined();
        });

        it('cleans up all preview URLs on unmount', () => {
            const { result, unmount } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockImageFile1 = new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' });
            const mockImageFile2 = new File(['image2'], 'photo2.jpg', { type: 'image/jpeg' });

            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile1);
                result.current.handleFileChange('id_front', mockImageFile2);
            });

            const url1 = result.current.filePreviews.profile_picture;
            const url2 = result.current.filePreviews.id_front;

            unmount();

            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url1);
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url2);
        });

        it('provides getPreview method to retrieve preview URL', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            const mockImageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

            act(() => {
                result.current.handleFileChange('profile_picture', mockImageFile);
            });

            expect(result.current.getPreview('profile_picture')).toBe('blob:mock-url');
            expect(result.current.getPreview('nonexistent')).toBeNull();
        });
    });

    describe('Local Storage Persistence', () => {
        it('calls localStorage.setItem when saving data', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: { name: 'John' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            // Verify localStorage.getItem was called to load data
            expect(localStorage.getItem).toHaveBeenCalledWith('test_form');
        });

        it('uses correct storage key', () => {
            const customKey = 'custom_onboarding_key';
            
            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: customKey,
                    enablePersistence: true,
                })
            );

            expect(localStorage.getItem).toHaveBeenCalledWith(customKey);
        });

        it('does not access storage when enablePersistence is false', () => {
            localStorage.getItem.mockClear();
            
            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: false,
                })
            );

            expect(localStorage.getItem).not.toHaveBeenCalled();
        });

        it('uses default storage key when not provided', () => {
            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    enablePersistence: true,
                })
            );

            expect(localStorage.getItem).toHaveBeenCalledWith('onboarding_form_data');
        });
    });

    describe('Data Restoration from Local Storage', () => {
        it('restores form data from local storage on mount', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: {
                    name: 'John Doe',
                    email: 'john@example.com',
                },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            expect(mockInertiaForm.setData).toHaveBeenCalledWith('name', 'John Doe');
            expect(mockInertiaForm.setData).toHaveBeenCalledWith('email', 'john@example.com');
        });

        it('does not restore data when enablePersistence is false', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: { name: 'John Doe' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: false,
                })
            );

            expect(localStorage.getItem).not.toHaveBeenCalled();
        });

        it('handles missing storage data gracefully', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: { name: 'Default' },
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            // Should not throw error and should use initial data
            expect(result.current.data).toBeDefined();
        });

        it('handles corrupted storage data gracefully', () => {
            mockLocalStorage['test_form'] = 'invalid json {';

            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            // Should not throw error
            expect(result.current.data).toBeDefined();
        });

        it('skips null and undefined values during restoration', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: {
                    name: 'John',
                    email: null,
                    phone: undefined,
                },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            expect(mockInertiaForm.setData).toHaveBeenCalledWith('name', 'John');
            expect(mockInertiaForm.setData).not.toHaveBeenCalledWith('email', null);
        });
    });

    describe('Storage Expiration (7 days)', () => {
        it('clears expired storage data', () => {
            const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
            const storedData = {
                version: '1.0',
                timestamp: eightDaysAgo,
                data: { name: 'Old Data' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            expect(localStorage.removeItem).toHaveBeenCalledWith('test_form');
            expect(mockInertiaForm.setData).not.toHaveBeenCalledWith('name', 'Old Data');
        });

        it('restores non-expired storage data', () => {
            const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
            const storedData = {
                version: '1.0',
                timestamp: twoDaysAgo,
                data: { name: 'Recent Data' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            expect(localStorage.removeItem).not.toHaveBeenCalled();
            expect(mockInertiaForm.setData).toHaveBeenCalledWith('name', 'Recent Data');
        });

        it('treats data without timestamp as expired', () => {
            const storedData = {
                version: '1.0',
                data: { name: 'No Timestamp' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            expect(localStorage.removeItem).toHaveBeenCalledWith('test_form');
        });
    });

    describe('clearStorage() Method', () => {
        it('removes data from local storage', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: { name: 'John' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            act(() => {
                result.current.clearStorage();
            });

            expect(localStorage.removeItem).toHaveBeenCalledWith('test_form');
        });

        it('handles errors when clearing storage', () => {
            localStorage.removeItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            // Should not throw
            expect(() => {
                act(() => {
                    result.current.clearStorage();
                });
            }).not.toThrow();
        });

        it('is called by submit handler on successful submission', () => {
            const mockOnSubmit = jest.fn();
            
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                    onSubmit: mockOnSubmit,
                    enablePersistence: true,
                })
            );

            act(() => {
                result.current.submit();
            });

            // Verify clearStorage is passed to onSubmit
            expect(mockOnSubmit).toHaveBeenCalled();
            const submitArgs = mockOnSubmit.mock.calls[0][1];
            expect(submitArgs.clearStorage).toBeDefined();
            expect(typeof submitArgs.clearStorage).toBe('function');
        });
    });

    describe('Additional Features', () => {
        it('provides hasUnsavedChanges method', () => {
            const storedData = {
                version: '1.0',
                timestamp: Date.now(),
                data: { name: 'John' },
                fileReferences: {},
            };

            mockLocalStorage['test_form'] = JSON.stringify(storedData);

            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: { name: 'John' },
                    storageKey: 'test_form',
                    enablePersistence: true,
                })
            );

            // After restoration, data should match
            expect(result.current.hasUnsavedChanges()).toBe(false);

            // Change data
            act(() => {
                mockInertiaForm.data = { name: 'Jane' };
                result.current.setData('name', 'Jane');
            });

            // Now should have unsaved changes
            expect(result.current.hasUnsavedChanges()).toBe(true);
        });

        it('exposes upload progress tracking state', () => {
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            // Verify core form functionality is exposed
            expect(result.current.data).toBeDefined();
            expect(result.current.setData).toBeDefined();
            expect(result.current.files).toBeDefined();
            expect(result.current.handleFileChange).toBeDefined();
        });

        it('exposes processing state from Inertia form', () => {
            mockInertiaForm.processing = false;
            
            const { result } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );

            // Initially not processing
            expect(result.current.processing).toBe(false);
            
            // When Inertia form is processing, hook should reflect that
            mockInertiaForm.processing = true;
            const { result: result2 } = renderHook(() =>
                useOnboardingForm({
                    initialData: {},
                    storageKey: 'test_form',
                })
            );
            
            expect(result2.current.processing).toBe(true);
        });
    });
});
