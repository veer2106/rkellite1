import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

const Categories = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', sortOrder: 0 });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/menu');
      return;
    }
    fetchCategories();
  }, [user?.role, navigate]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/menu/categories');
      const list = (data.data || []).filter(c => c && (c.id || c.name));
      setCategories(list);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch categories');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      if (editingCategory) {
        await api.put(`/menu/categories/${editingCategory.id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/menu/categories', formData);
        toast.success('Category added successfully');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', sortOrder: 0 });
      fetchCategories();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save category';
      toast.error(msg);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      sortOrder: category.sortOrder ?? 0
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? This will fail if menu items use it.`)) return;
    try {
      await api.delete(`/menu/categories/${category.id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete category';
      toast.error(msg);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', sortOrder: categories.length });
    setShowModal(true);
  };

  if (user?.role !== 'admin') return null;

  if (loading) {
    return <div className="text-center py-12">Loading categories...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Categories</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      <p className="text-gray-500 mb-6">Manage categories for menu items. Categories are used to group items in the menu and POS.</p>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TagIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No categories yet. Add one to get started.</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Add first category
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((cat, index) => (
              <li
                key={cat.id || cat.name || index}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  {cat.sortOrder != null && (
                    <p className="text-sm text-gray-500">Order: {cat.sortOrder}</p>
                  )}
                </div>
                {cat.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {!cat.id && (
                  <span className="text-xs text-amber-600">Run seed to manage</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Beverages"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCategory(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
