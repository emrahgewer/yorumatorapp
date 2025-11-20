import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const ProductDetailScreen = ({ route }) => {
  const { productId } = route.params || {};
  const navigation = useNavigation();
  const { isAuthenticated, userToken, currentUser, logout } = useAuth();
  const [productDetail, setProductDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewUsername, setNewReviewUsername] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [likeStats, setLikeStats] = useState({});

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
      fetchReviews();
      if (isAuthenticated) {
        checkFavorite();
        fetchLikeStats();
      }
    } else {
      setError('Ürün ID bulunamadı');
      setLoading(false);
    }
  }, [productId, isAuthenticated]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      setProductDetail(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ürün detayları yüklenirken bir hata oluştu');
      console.error('Product detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`);
      setReviews(response.data || []);
    } catch (err) {
      console.error('Reviews fetch error:', err);
      setReviews([]);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/products/${productId}/favorite`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setIsFavorite(response.data.is_favorite || false);
    } catch (err) {
      console.error('Favorite check error:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Favorilere eklemek için giriş yapmalısınız.');
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await axios.delete(
          `${API_BASE_URL}/products/${productId}/favorite`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setIsFavorite(false);
      } else {
        await axios.post(
          `${API_BASE_URL}/products/${productId}/favorite`,
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      Alert.alert('Hata', 'Favori işlemi başarısız');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const fetchLikeStats = async () => {
    try {
      const headers = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }
      const response = await axios.get(
        `${API_BASE_URL}/reviews/${reviews[0]?.id || ''}/likes`,
        { headers }
      );
      // Tüm yorumlar için like stats al
      const stats = {};
      for (const review of reviews) {
        try {
          const statResponse = await axios.get(
            `${API_BASE_URL}/reviews/${review.id}/likes`,
            { headers }
          );
          stats[review.id] = statResponse.data;
        } catch (e) {
          // Ignore errors for individual reviews
        }
      }
      setLikeStats(stats);
    } catch (err) {
      console.error('Like stats error:', err);
    }
  };

  const toggleLike = async (reviewId, isLike) => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Beğenmek için giriş yapmalısınız.');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/reviews/${reviewId}/like`,
        { is_like: isLike },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      fetchLikeStats();
      fetchReviews();
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısınız.', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (!newReviewText.trim()) {
      Alert.alert('Hata', 'Lütfen yorum metnini doldurun.');
      return;
    }

    const optimisticReview = {
      id: `temp-${Date.now()}`,
      author_alias: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Sen',
      rating: newReviewRating,
      body: newReviewText,
      created_at: new Date().toISOString(),
    };
    setReviews([optimisticReview, ...reviews]);

    const reviewText = newReviewText;
    const reviewRating = newReviewRating;
    setNewReviewText('');
    setNewReviewRating(5);
    setSubmittingReview(true);

    try {
      const headers = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const payload = {
        rating: reviewRating,
        text: reviewText,
      };

      const response = await axios.post(
        `${API_BASE_URL}/products/${productId}/reviews`,
        payload,
        { headers }
      );

      await fetchReviews();
      await fetchProductDetail();
      if (isAuthenticated) {
        fetchLikeStats();
      }

      const successMessage = response.data?.message || 'Yorumunuz başarıyla gönderildi.';
      Alert.alert('Başarılı', successMessage);
    } catch (err) {
      setReviews(reviews.filter(r => r.id !== optimisticReview.id));
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
        const errorMessage = err.response?.data?.detail || err.message || 'Yorum gönderilirken bir hata oluştu';
        Alert.alert('Hata', errorMessage);
      }
      console.error('Submit review error:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `${productDetail.brand} ${productDetail.model} - ${productDetail.average_rating ? `${productDetail.average_rating}/5 ⭐` : 'Yorumator\'da incele!'}`;
      await Share.share({
        message: shareMessage,
        title: `${productDetail.brand} ${productDetail.model}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Fiyat bilgisi yok';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const renderSpecs = (specs) => {
    if (!specs || typeof specs !== 'object') {
      return <Text style={styles.specText}>Teknik özellik bilgisi yok</Text>;
    }

    return Object.entries(specs).map(([key, value]) => (
      <View key={key} style={styles.specRow}>
        <Text style={styles.specKey}>{key}:</Text>
        <Text style={styles.specValue}>{String(value)}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator animating={loading} size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ürün detayları yükleniyor...</Text>
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
            fetchProductDetail();
            fetchReviews();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!productDetail) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ürün bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.brand}>{productDetail.brand || 'Bilinmeyen Marka'}</Text>
            <Text style={styles.model}>{productDetail.model || 'Bilinmeyen Model'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleFavorite}
              disabled={favoriteLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {favoriteLoading ? '...' : (isFavorite ? '❤️' : '🤍')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(productDetail.price)}</Text>
        </View>
        
        {(productDetail.average_rating !== null && productDetail.average_rating !== undefined) && (
          <View style={styles.ratingSection}>
            <RatingStars 
              rating={productDetail.average_rating} 
              size={24} 
              showNumber={true}
              reviewCount={productDetail.review_count || 0}
            />
            {productDetail.review_count > 0 && (
              <View style={styles.reviewCountBadge}>
                <Text style={styles.reviewCountBadgeText}>
                  {productDetail.review_count} {productDetail.review_count === 1 ? 'yorum' : 'yorum'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.specsSection}>
        <Text style={styles.sectionTitle}>Teknik Özellikler</Text>
        <View style={styles.specsContainer}>
          {renderSpecs(productDetail.specs)}
        </View>
      </View>

      <View style={styles.reviewsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kullanıcı Yorumları</Text>
          {reviews.length > 0 && (
            <View style={styles.reviewCountBadgeInline}>
              <Text style={styles.reviewCountBadgeTextInline}>{reviews.length}</Text>
            </View>
          )}
        </View>
        {reviews.length === 0 ? (
          <View style={styles.noReviewsContainer}>
            <Text style={styles.noReviewsIcon}>💬</Text>
            <Text style={styles.noReviewsText}>Henüz yorum yapılmamış.</Text>
            <Text style={styles.noReviewsSubtext}>İlk yorumu sen yap!</Text>
          </View>
        ) : (
          reviews.map((review, index) => {
            const stats = likeStats[review.id] || { like_count: 0, dislike_count: 0, user_like_status: null };
            return (
              <View key={review.id || index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUsername}>
                    {review.author_alias || review.author?.username || review.username || 'Anonim Kullanıcı'}
                  </Text>
                  <RatingStars rating={review.rating} size={16} showNumber={false} />
                </View>
                <Text style={styles.reviewText}>{review.body || review.text}</Text>
                {isAuthenticated && (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      style={[styles.likeButton, stats.user_like_status === true && styles.likeButtonActive]}
                      onPress={() => toggleLike(review.id, true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.likeButtonText}>
                        👍 {stats.like_count || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.likeButton, stats.user_like_status === false && styles.dislikeButtonActive]}
                      onPress={() => toggleLike(review.id, false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.likeButtonText}>
                        👎 {stats.dislike_count || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.reviewFormSection}>
        <Text style={styles.sectionTitle}>Yorum Yap</Text>
        {!isAuthenticated ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Yorum yapmak için giriş yapmalısınız.</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    newReviewRating === rating && styles.ratingButtonSelected,
                  ]}
                  onPress={() => setNewReviewRating(rating)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ratingButtonText}>
                    {newReviewRating >= rating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Yorumunuzu yazın..."
              value={newReviewText}
              onChangeText={setNewReviewText}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              textAlignVertical="top"
              editable={isAuthenticated}
            />
            <TouchableOpacity
              style={[styles.submitButton, (!isAuthenticated || submittingReview) && styles.submitButtonDisabled]}
              onPress={submitReview}
              activeOpacity={0.7}
              disabled={!isAuthenticated || submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Yorumu Gönder</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
  ratingSection: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 20,
  },
  brand: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  model: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  priceContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  reviewCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reviewCountBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  reviewCountBadgeInline: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 32,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  reviewCountBadgeTextInline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specsSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  specsContainer: {
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    flex: 1,
  },
  specValue: {
    fontSize: 16,
    color: '#111827',
    flex: 2,
  },
  specText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  reviewsSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUsername: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  reviewText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  likeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  likeButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  dislikeButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  likeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  noReviewsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  noReviewsIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noReviewsText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '400',
  },
  reviewFormSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  loginPrompt: {
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  ratingButton: {
    padding: 8,
  },
  ratingButtonSelected: {
    opacity: 1,
  },
  ratingButtonText: {
    fontSize: 24,
  },
  reviewInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;

