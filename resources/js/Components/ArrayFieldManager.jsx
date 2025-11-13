import React, { memo, useMemo, useCallback } from 'react';

/**
 * Component for managing array fields (services, skills, etc.)
 * Supports simple arrays and object arrays (like skills with experience)
 * Uses stable keys for better React performance
 */
const ArrayFieldManager = memo(function ArrayFieldManager({
    label,
    items,
    onUpdate,
    disabled = false,
    itemType = 'string', // 'string' or 'object'
    objectFields = null, // For object arrays: [{key: 'skill', label: 'Skill'}, {key: 'experience_level', label: 'Level', type: 'select', options: [...]}]
    placeholder = '',
    addButtonText = '+ Add Item',
    removeButtonText = 'Remove',
    className = '',
}) {
    // Generate stable keys for items - use content + index for uniqueness
    const getItemKey = useCallback((item, index) => {
        if (itemType === 'object' && item._id) {
            return item._id;
        }
        // Create stable key based on content and position
        const contentHash = itemType === 'object' 
            ? JSON.stringify(item).slice(0, 50)
            : String(item).slice(0, 30);
        return `${index}_${contentHash}`;
    }, [itemType]);

    const itemKeys = useMemo(() => {
        return items.map((item, index) => getItemKey(item, index));
    }, [items, getItemKey]);

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        if (itemType === 'object') {
            updated[index] = { ...updated[index], [field]: value };
        } else {
            updated[index] = value;
        }
        onUpdate(updated);
    };

    const handleAdd = () => {
        if (itemType === 'object' && objectFields) {
            const newItem = {};
            objectFields.forEach(field => {
                newItem[field.key] = field.defaultValue !== undefined 
                    ? field.defaultValue 
                    : (field.type === 'select' ? (field.options?.[0]?.value || '') : '');
            });
            onUpdate([...items, newItem]);
        } else {
            onUpdate([...items, '']);
        }
    };
    
    const handleRemove = (index) => {
        onUpdate(items.filter((_, i) => i !== index));
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="space-y-2">
                {items.map((item, index) => {
                    const itemKey = itemKeys[index];
                    
                    return (
                        <div key={itemKey} className="flex gap-2 items-start">
                            {itemType === 'object' && objectFields ? (
                                <>
                                    {objectFields.map((field, fieldIdx) => (
                                        <div key={field.key} className={fieldIdx === 0 ? 'flex-1' : field.width || 'w-48'}>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={item[field.key] || ''}
                                                    onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                                                    disabled={disabled}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                                >
                                                    {field.options?.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    value={item[field.key] || ''}
                                                    onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                                                    disabled={disabled}
                                                    placeholder={field.placeholder || field.label}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleItemChange(index, null, e.target.value)}
                                    disabled={disabled}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                    placeholder={placeholder}
                                />
                            )}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                >
                                    {removeButtonText}
                                </button>
                            )}
                        </div>
                    );
                })}
                {!disabled && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        {addButtonText}
                    </button>
                )}
            </div>
        </div>
    );
});

export default ArrayFieldManager;
