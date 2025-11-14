import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SkillExperienceSelector from '../SkillExperienceSelector';

// Mock the taxonomy file
jest.mock('../../../../full_freelance_services_taxonomy.json', () => ({
  services: [
    {
      categories: [
        {
          skills: ['React', 'JavaScript', 'Vue.js', 'Angular', 'TypeScript']
        }
      ]
    }
  ]
}));

describe('SkillExperienceSelector - Duplicate Prevention (Task 7.2)', () => {
  let mockOnChange;

  beforeEach(() => {
    mockOnChange = jest.fn();
    // Clear alert mock
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Try to add "React" then "react" (should fail)
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('prevents adding duplicate skill with different case', async () => {
    const user = userEvent.setup();
    
    // Start with one skill already added
    const existingSkills = [
      { skill: 'React', experience_level: 'intermediate', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add "react" (lowercase)
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'react');
    
    // Press Enter to add
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Wait for alert to be called
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });

    // Verify onChange was NOT called (skill not added)
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  /**
   * Test: Try to add "React" then " React " (should fail)
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('prevents adding duplicate skill with whitespace', async () => {
    const user = userEvent.setup();
    
    // Start with one skill already added
    const existingSkills = [
      { skill: 'React', experience_level: 'intermediate', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add " React " (with whitespace)
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, ' React ');
    
    // Press Enter to add
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Wait for alert to be called
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });

    // Verify onChange was NOT called (skill not added)
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  /**
   * Test: Try to add "REACT" (uppercase) when "React" exists (should fail)
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('prevents adding duplicate skill with different casing variations', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'React', experience_level: 'intermediate', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add "REACT" (all uppercase)
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'REACT');
    
    // Click the add button
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    // Verify alert was called
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });

    // Verify onChange was NOT called
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  /**
   * Test: Verify error message displays correctly
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('displays correct error message when duplicate detected', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'JavaScript', experience_level: 'expert', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add duplicate
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'javascript');
    
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    // Verify the exact error message
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
  });

  /**
   * Test: Allows adding unique skills
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('allows adding unique skills without error', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'React', experience_level: 'intermediate', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Add a different skill
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'Vue.js');
    
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    // Verify alert was NOT called
    expect(global.alert).not.toHaveBeenCalled();

    // Verify onChange WAS called with the new skill
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        { skill: 'React', experience_level: 'intermediate', importance: 'required' },
        { skill: 'Vue.js', experience_level: 'intermediate', importance: 'required' }
      ]);
    });
  });

  /**
   * Test: Multiple duplicate attempts with various formats
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('prevents multiple duplicate attempts with various formats', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'TypeScript', experience_level: 'expert', importance: 'required' }
    ];

    const { rerender } = render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });

    // Attempt 1: lowercase
    await user.clear(input);
    await user.type(input, 'typescript');
    await user.click(addButton);
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Reset alert mock
    global.alert.mockClear();

    // Attempt 2: with spaces
    await user.clear(input);
    await user.type(input, '  TypeScript  ');
    await user.click(addButton);
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Reset alert mock
    global.alert.mockClear();

    // Attempt 3: mixed case
    await user.clear(input);
    await user.type(input, 'TyPeScRiPt');
    await user.click(addButton);
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  /**
   * Test: Duplicate prevention with custom skills
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('prevents duplicates for custom skills', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'Custom Framework XYZ', experience_level: 'expert', importance: 'required' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add the same custom skill with different case
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'custom framework xyz');
    
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  /**
   * Test: Trimming preserves proper casing when adding new skill
   * Requirements: 2.2, 2.3
   */
  test('trims whitespace but preserves casing when adding new skill', async () => {
    const user = userEvent.setup();
    
    render(
      <SkillExperienceSelector
        skills={[]}
        onChange={mockOnChange}
      />
    );

    // Add skill with whitespace
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, '  Angular  ');
    
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    // Verify skill was added with trimmed whitespace but preserved casing
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        { skill: 'Angular', experience_level: 'intermediate', importance: 'required' }
      ]);
    });
  });

  /**
   * Test: Case-insensitive duplicate check with multiple existing skills
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  test('checks duplicates against all existing skills case-insensitively', async () => {
    const user = userEvent.setup();
    
    const existingSkills = [
      { skill: 'React', experience_level: 'intermediate', importance: 'required' },
      { skill: 'Vue.js', experience_level: 'intermediate', importance: 'required' },
      { skill: 'Angular', experience_level: 'beginner', importance: 'preferred' }
    ];

    render(
      <SkillExperienceSelector
        skills={existingSkills}
        onChange={mockOnChange}
      />
    );

    // Try to add "VUE.JS" (different case)
    const input = screen.getByPlaceholderText(/Type or add custom skill/i);
    await user.type(input, 'VUE.JS');
    
    const addButton = screen.getByRole('button', { name: /\+ Add Skill/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('This skill is already added');
    });
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
