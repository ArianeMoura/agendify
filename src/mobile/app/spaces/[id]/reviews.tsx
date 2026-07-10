import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { reviewsApi } from '@/lib/api/reviews';
import type { Review } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { StarRating } from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/Toast';

export default function SpaceReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const toast = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string | undefined>();

  const {
    data: reviews,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getBySpace(id),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setRating(0);
      setComment('');
      setRatingError(undefined);
      toast.show('Avaliação enviada. Obrigado!', { type: 'success' });
    },
    onError: () => {
      toast.show('Não foi possível enviar sua avaliação.', { type: 'error' });
    },
  });

  const handleSubmit = () => {
    if (rating < 1) {
      setRatingError('Selecione de 1 a 5 estrelas.');
      return;
    }
    createMutation.mutate({
      spaceId: id,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const average = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const header = (
    <View style={styles.headerArea}>
      {name ? (
        <Text style={styles.spaceName} accessibilityRole="header">
          {name}
        </Text>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.average}>{average.toFixed(1)}</Text>
          <StarRating value={Math.round(average)} size={18} />
          <Text style={styles.count}>
            {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
          </Text>
        </View>
      ) : null}

      <Card style={styles.formCard}>
        <Text style={styles.formTitle} accessibilityRole="header">
          Deixe sua avaliação
        </Text>
        <StarRating
          value={rating}
          onChange={(value) => {
            setRating(value);
            setRatingError(undefined);
          }}
          size={32}
          style={styles.formStars}
        />
        {ratingError ? (
          <Text
            style={styles.ratingError}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {ratingError}
          </Text>
        ) : null}
        <Input
          label="Comentário (opcional)"
          placeholder="Conte como foi sua experiência"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          style={styles.commentInput}
        />
        <Button
          title="Enviar avaliação"
          onPress={handleSubmit}
          isLoading={createMutation.isPending}
          fullWidth
        />
      </Card>

      <Text style={styles.listTitle} accessibilityRole="header">
        Avaliações
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Carregando avaliações..." />
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding>
      <FlatList
        data={reviews ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReviewRow review={item} styles={styles} colors={colors} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="Ainda sem avaliações"
            message="Seja o primeiro a avaliar este espaço."
          />
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching}
      />
    </Screen>
  );
}

function ReviewRow({
  review,
  styles,
  colors: _colors,
}: {
  review: Review;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const date = (() => {
    try {
      return format(new Date(review.createdAt), "d 'de' MMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return '';
    }
  })();

  return (
    <Card variant="outlined" style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <StarRating value={review.rating} size={16} />
        {date ? <Text style={styles.reviewDate}>{date}</Text> : null}
      </View>
      {review.comment ? (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      ) : null}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    listContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    headerArea: {
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    spaceName: {
      ...typography.h3,
      color: colors.text,
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    average: {
      ...typography.h4,
      color: colors.text,
    },
    count: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    formCard: {
      gap: spacing.sm,
    },
    formTitle: {
      ...typography.h5,
      color: colors.text,
    },
    formStars: {
      marginVertical: spacing.xs,
    },
    ratingError: {
      ...typography.caption,
      color: colors.danger,
    },
    commentInput: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    listTitle: {
      ...typography.h5,
      color: colors.text,
      marginTop: spacing.sm,
    },
    reviewCard: {
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reviewDate: {
      ...typography.caption,
      color: colors.textMuted,
    },
    reviewComment: {
      ...typography.body,
      color: colors.text,
    },
  });
