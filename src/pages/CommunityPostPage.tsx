import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PostCard } from '@/components/community/PostCard';
import { CommunityIcon } from '@/components/community/CommunityAvatar';
import { communityApi, type ApiCommunity, type CommunityPost } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';

/** A single community post with its comments — opened from notifications. */
export default function CommunityPostPage() {
  const { postId = '' } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [community, setCommunity] = useState<ApiCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    communityApi
      .getPost(postId)
      .then((data) => {
        setCommunity(data.community);
        setPost({ ...data, community: data.community._id });
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="pt-24 pb-24">
      <Container className="!max-w-2xl">
        {community && (
          <Link to={`/communities/${community.slug}`} className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-white/60 hover:text-white">
            <ArrowLeft size={15} />
            <CommunityIcon iconUrl={community.iconUrl} name={community.name} size={28} />
            {community.name}
          </Link>
        )}

        {loading && (
          <div className="flex justify-center py-16 text-white/50">
            <Loader2 size={26} className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-white/60">
            <AlertCircle size={26} className="text-red-400" />
            <p>{error}</p>
            <Link to="/communities" className="text-sm font-semibold text-orange-300">
              Back to communities
            </Link>
          </div>
        )}

        {!loading && post && community && (
          <PostCard
            post={post}
            canInteract={community.membership?.status === 'active'}
            canModerate={community.canModerate}
            onChange={setPost}
            onDelete={() => navigate(`/communities/${community.slug}`)}
            defaultShowComments
          />
        )}
      </Container>
    </div>
  );
}