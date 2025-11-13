/**
 * Flatten the hierarchical skills taxonomy into a single array of skill names
 * @param {Object} taxonomy - The skills taxonomy object with services, categories, and skills
 * @returns {Array<string>} - Flat array of all skill names
 */
export function flattenSkillsTaxonomy(taxonomy) {
    if (!taxonomy || !taxonomy.services) {
        return [];
    }

    const allSkills = [];
    
    taxonomy.services.forEach(service => {
        if (service.categories && Array.isArray(service.categories)) {
            service.categories.forEach(category => {
                if (category.skills && Array.isArray(category.skills)) {
                    category.skills.forEach(skill => {
                        // Avoid duplicates
                        if (!allSkills.includes(skill)) {
                            allSkills.push(skill);
                        }
                    });
                }
            });
        }
    });

    // Sort alphabetically for better UX
    return allSkills.sort((a, b) => a.localeCompare(b));
}

/**
 * Get skills for specific services
 * @param {Object} taxonomy - The skills taxonomy object
 * @param {Array<string>} serviceNames - Array of service names to get skills for
 * @returns {Array<string>} - Array of skills for the specified services
 */
export function getSkillsForServices(taxonomy, serviceNames) {
    if (!taxonomy || !taxonomy.services || !Array.isArray(serviceNames)) {
        return [];
    }

    const skills = [];

    taxonomy.services.forEach(service => {
        if (service.categories && Array.isArray(service.categories)) {
            service.categories.forEach(category => {
                if (serviceNames.includes(category.name) && category.skills) {
                    category.skills.forEach(skill => {
                        if (!skills.includes(skill)) {
                            skills.push(skill);
                        }
                    });
                }
            });
        }
    });

    return skills.sort((a, b) => a.localeCompare(b));
}
