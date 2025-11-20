import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import FilterModal from '../components/FilterModal';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const ProductsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [sortBy, setSortBy] = useState(null);
  const [minRating, setMinRating] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  const fetchProducts = async (searchText = null, categoryId = null, brandValue = null, sortValue = null, minRatingValue = null) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/products/`;
      const params = new URLSearchParams();
      
      if (searchText && searchText.trim()) {
        params.append('search', searchText.trim());
      }
      if (categoryId) {
        params.append('category_id', categoryId);
      }
      if (brandValue) {
        params.append('brand', brandValue);
      }
      if (sortValue) {
        params.append('sort_by', sortValue);
      }
      if (minRatingValue !== null && minRatingValue !== undefined) {
        params.append('min_rating', minRatingValue.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ürünler yüklenirken bir hata oluştu');
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/brands/`);
      setBrands(response.data || []);
    } catch (err) {
      console.error('Brands fetch error:', err);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (route.params?.category_id) {
      setSelectedCategoryId(route.params.category_id);
      fetchProducts(searchQuery, route.params.category_id, selectedBrand, sortBy, minRating);
    } else if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchProducts();
    }
  }, [route.params?.category_id]);

  useEffect(() => {
    if (!isInitialMount.current) {
      fetchProducts(searchQuery, selectedCategoryId, selectedBrand, sortBy, minRating);
    }
  }, [selectedCategoryId, selectedBrand, sortBy, minRating]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#fff', fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Favorites')}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#fff', fontSize: 20 }}>❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductSubmit')}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts(text, selectedCategoryId, selectedBrand, sortBy, minRating);
    }, 500);
  };

  const handleBrandSelect = (brand) => {
    const newBrand = selectedBrand === brand ? null : brand;
    setSelectedBrand(newBrand);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProducts(searchQuery, selectedCategoryId, selectedBrand, sortBy, minRating),
      fetchBrands(),
    ]);
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return null;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategoryId) count++;
    if (selectedBrand) count++;
    if (sortBy) count++;
    if (minRating !== null && minRating !== undefined) count++;
    return count;
  };

  const getProductEmoji = (brand, model) => {
    const brandLower = (brand || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const combined = `${brandLower} ${modelLower}`;
    
    if (combined.includes('tv') || combined.includes('televizyon')) return '📺';
    if (combined.includes('buzdolab') || combined.includes('refrigerator')) return '❄️';
    if (combined.includes('çamaşır') || combined.includes('washing')) return '🌀';
    if (combined.includes('robot') || combined.includes('vacuum')) return '🤖';
    if (combined.includes('fırın') || combined.includes('oven')) return '🔥';
    if (combined.includes('bulaşık') || combined.includes('dishwasher')) return '🍽️';
    if (combined.includes('klima') || combined.includes('air')) return '❄️';
    if (combined.includes('telefon') || combined.includes('phone') || combined.includes('iphone') || combined.includes('galaxy')) return '📱';
    if (combined.includes('tablet') || combined.includes('ipad')) return '📱';
    if (combined.includes('laptop') || combined.includes('macbook')) return '💻';
    return '📷';
  };

  const renderProduct = ({ item }) => {
    const productId = typeof item.id === 'string' 
      ? item.id 
      : (item.id && typeof item.id.toString === 'function' 
          ? item.id.toString() 
          : String(item.id || ''));

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => {
          navigation.navigate('ProductDetail', { productId });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.productContent}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderText}>
              {getProductEmoji(item.brand, item.model)}
            </Text>
          </View>

          <View style={styles.productInfo}>
            <View style={styles.productHeader}>
              <View style={styles.productTextContainer}>
                <Text style={styles.brand}>{item.brand || 'Bilinmeyen Marka'}</Text>
                <Text style={styles.model}>{item.model || 'Bilinmeyen Model'}</Text>
                {item.price !== null && item.price !== undefined && (
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                )}
              </View>
              
              {item.average_rating !== null && item.average_rating !== undefined && (
                <View style={styles.ratingBadge}>
                  <RatingStars 
                    rating={item.average_rating} 
                    size={16} 
                    showNumber={true}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading === true && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ürün ara..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={false}
            />
          </View>
          <TouchableOpacity
            style={styles.categoriesButton}
            disabled
            activeOpacity={0.7}
          >
            <Text style={styles.categoriesButtonText}>Kategoriler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            disabled
            activeOpacity={0.7}
          >
            <Text style={styles.filterButtonText}>Filtrele</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          {[...Array(5)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Hata: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            fetchProducts(searchQuery, selectedCategoryId, selectedBrand, sortBy, minRating);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={() => navigation.navigate('CategoryMenu')}
          activeOpacity={0.7}
        >
          <Text style={styles.categoriesButtonText}>Kategoriler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterButtonText}>Filtrele</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {brands.length > 0 && (
        <View style={styles.brandsContainerWrapper}>
          <View style={styles.brandsContainer}>
            {brands.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandChip,
                  selectedBrand === brand && styles.brandChipSelected,
                ]}
                onPress={() => handleBrandSelect(brand)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    selectedBrand === brand && styles.brandChipTextSelected,
                  ]}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!searchQuery.trim() && !selectedCategoryId && !selectedBrand && (
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
          <Text style={styles.welcomeSubtitle}>
            En yeni ürünler burada. Kategorilere göre filtreleyebilir veya arama yapabilirsiniz.
          </Text>
        </View>
      )}
      
      {products.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>
            {searchQuery.trim() || selectedCategoryId || selectedBrand
              ? '🔍' 
              : '📦'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery.trim() || selectedCategoryId || selectedBrand
              ? 'Aradığınız kritere uygun ürün bulunamamıştır.' 
              : 'Henüz ürün bulunmamaktadır.'}
          </Text>
          {!searchQuery.trim() && !selectedCategoryId && !selectedBrand && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('ProductSubmit')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionButtonText}>İlk Ürünü Ekle</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => {
            if (typeof item.id === 'string') {
              return item.id;
            }
            if (item.id && typeof item.id.toString === 'function') {
              return item.id.toString();
            }
            return String(item.id || Math.random());
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(sort, rating) => {
          setSortBy(sort);
          setMinRating(rating);
        }}
        initialSortBy={sortBy}
        initialMinRating={minRating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoriesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  categoriesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  brandsContainerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 8,
  },
  brandsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  brandChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brandChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  brandChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  brandChipTextSelected: {
    color: '#007AFF',
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  listContainer: {
    padding: 16,
    paddingTop: 4,
  },
  productItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTextContainer: {
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  model: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 4,
  },
  ratingBadge: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    fontWeight: '600',
    lineHeight: 26,
  },
  emptyActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductsScreen;

