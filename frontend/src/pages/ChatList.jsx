import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import Page from '../components/navigation/Page'
import ConversationList from '../components/ConversationList'
import { EmptyState } from '../components/ui/Feedback'
import useChatStore from '../store/chatStore'

export default function ChatList() {
    const { conversations, fetchConversations, isLoadingConversations, error } = useChatStore()

    useEffect(() => {
        fetchConversations({ silent: conversations.length > 0 })
    }, [])

    return (
        <Page title="Messages">
            <div className="grid overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-[320px_1fr]">
                <div className="md:border-r md:border-line">
                    <ConversationList
                        conversations={conversations}
                        loading={isLoadingConversations && conversations.length === 0}
                        error={error}
                        onRetry={() => fetchConversations()}
                    />
                </div>
                <div className="hidden min-h-[480px] items-center justify-center md:flex">
                    <EmptyState icon={MessageSquare} title="Select a conversation" message="Choose a chat on the left to read and reply." />
                </div>
            </div>
        </Page>
    )
}
