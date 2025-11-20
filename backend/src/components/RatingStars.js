import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RatingStars = ({ rating, size = 20, showNumber = false, reviewCount = null }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={[styles.star, { fontSize: size }]}>
            ⭐
          </Text>
        ))}
        {hasHalfStar && (
          <Text style={[styles.star, { fontSize: size }]}>⭐</Text>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={[styles.star, styles.emptyStar, { fontSize: size }]}>
            ⭐
          </Text>
        ))}
      </View>
      {showNumber && (
        <Text style={[styles.ratingText, { fontSize: size * 0.7 }]}>
          {rating?.toFixed(1) || '0.0'}
        </Text>
      )}
      {reviewCount !== null && reviewCount !== undefined && (
        <Text style={[styles.reviewCountText, { fontSize: size * 0.6 }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFD700',
  },
  emptyStar: {
    opacity: 0.3,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#111827',
  },
  reviewCountText: {
    marginLeft: 4,
    color: '#6B7280',
  },
});

export default RatingStars;

