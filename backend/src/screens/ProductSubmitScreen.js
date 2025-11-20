import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const ProductSubmitScreen = () => {
  const navigation = useNavigation();
  const { userToken, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  
  // Form state'leri
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [specs, setSpecs] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories/`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const parseSpecs = () => {
    if (!specs.trim()) {
      return null;
    }
    try {
      const parsed = JSON.parse(specs);
      if (Array.isArray(parsed)) {
        Alert.alert('Hata', 'Specs bir obje olmalıdır, array değil.');
        return false;
      }
      return parsed;
    } catch (e) {
      Alert.alert('Hata', 'Geçersiz JSON formatı. Örnek: {"ram": "8GB", "storage": "256GB"}');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!brand.trim() || !model.trim() || !selectedCategory) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const specsObj = parseSpecs();
    if (specsObj === false) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        brand: brand.trim(),
        model: model.trim(),
        category_id: selectedCategory.id,
        currency: 'TRY',
      };

      if (price.trim()) {
        const priceNum = parseFloat(price);
        if (!isNaN(priceNum) && priceNum >= 0) {
          payload.price = priceNum;
        }
      }

      if (sku.trim()) {
        payload.sku = sku.trim();
      }

      if (specsObj) {
        payload.specs = specsObj;
      }

      const response = await axios.post(
        `${API_BASE_URL}/products/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      Alert.alert(
        'Başarılı',
        'Ürün başarıyla eklendi!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              setBrand('');
              setModel('');
              setPrice('');
              setSku('');
              setSelectedCategory(null);
              setSpecs('');
              navigation.navigate('Products');
            },
          },
        ]
      );
    } catch (err) {
      if (err.response?.status === 401) {
        Alert.alert(
          'Oturum Süresi Doldu',
          'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Tamam',
              onPress: async () => {
                await logout();
              },
            },
          ]
        );
      } else {
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          'Ürün eklenirken bir hata oluştu';
        Alert.alert('Hata', errorMessage);
      }
      console.error('Submit product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        setSelectedCategory(item);
        setCategoryModalVisible(false);
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marka *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Samsung"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Galaxy S24"
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fiyat (TRY)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 29999"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            placeholder="Ürün SKU kodu (opsiyonel)"
            value={sku}
            onChangeText={setSku}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori *</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryButtonText, !selectedCategory && styles.placeholderText]}>
              {selectedCategory ? selectedCategory.name : 'Kategori Seçin'}
            </Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teknik Özellikler (JSON)</Text>
          <Text style={styles.helperText}>
            Örnek: {"{"}"ram": "8GB", "storage": "256GB", "screen": "6.1 inch"{"}"}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder='{"ram": "8GB", "storage": "256GB"}'
            value={specs}
            onChangeText={setSpecs}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Ürünü Gönder</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kategori Seçin</Text>
            <TouchableOpacity
              onPress={() => setCategoryModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalContent}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 20,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    padding: 16,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});

export default ProductSubmitScreen;

