'use client';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  Heading,
  Icon,
  IconButton,
  Input,
  Kbd,
  Progress,
  PromptComposer,
  StatCard,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  ThemeSwitcher,
} from '@bindshq/stance-react';

/**
 * A small, real composition of web components for one category, shown in the category blocks
 * on the home page. It is decoration inside a link, so it is inert and hidden from assistive tech.
 */
export function WebCategoryPreview({ id }: { id: string }) {
  const content = previews[id];
  if (!content) return null;
  return (
    <div className="category-preview" inert aria-hidden="true">
      {content}
    </div>
  );
}

const previews: Record<string, React.ReactNode> = {
  theming: <ThemeSwitcher />,
  foundations: (
    <Card style={{ inlineSize: '100%' }}>
      <Text weight="medium">Sales team</Text>
      <Text tone="muted" size="sm">
        12 members
      </Text>
    </Card>
  ),
  typography: (
    <div>
      <Heading level={3} className="category-preview__glyph">
        Aa
      </Heading>
      <Text tone="muted" size="sm">
        DM Sans, 12 sizes
      </Text>
    </div>
  ),
  actions: (
    <div className="category-preview__row">
      <Button>Deploy</Button>
      <Button variant="outline">Preview</Button>
      <IconButton label="More" icon={<Icon name="more-horizontal" size={16} />} variant="ghost" />
    </div>
  ),
  forms: (
    <div className="category-preview__stack">
      <Input aria-label="Name" defaultValue="Sales signature" />
      <div className="category-preview__row">
        <Switch aria-label="Apply" defaultChecked />
        <Checkbox aria-label="Notify" defaultChecked />
      </div>
    </div>
  ),
  navigation: (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
  'data-display': (
    <div className="category-preview__stack">
      <StatCard label="Signatures live" value="4,918" delta="+12%" trend="up" />
      <div className="category-preview__row">
        <AvatarGroup>
          <Avatar name="Priya Nair" />
          <Avatar name="Tom Berg" />
          <Avatar name="Ana Ruiz" />
        </AvatarGroup>
        <Badge>Active</Badge>
      </div>
    </div>
  ),
  feedback: (
    <div className="category-preview__stack">
      <Alert tone="success" title="Signature deployed" />
      <Progress value={68} aria-label="Rollout" />
    </div>
  ),
  overlays: (
    <div className="category-preview__menu">
      <span>
        <Icon name="pencil" size={14} /> Rename
      </span>
      <span>
        <Icon name="copy" size={14} /> Duplicate
      </span>
      <span data-danger="">
        <Icon name="trash" size={14} /> Delete
      </span>
    </div>
  ),
  media: (
    <div className="category-preview__row">
      <Code>useTheme()</Code>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </div>
  ),
  advanced: (
    <div className="category-preview__signature">
      <svg viewBox="0 0 200 60" width="100%" height="60">
        <path
          d="M8 44c18-30 30-30 26-6s14 10 22-6 12-14 14 2 10 14 22-2 18-20 26 0 14 10 30-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <Text tone="muted" size="sm">
        Sign here
      </Text>
    </div>
  ),
  ai: <PromptComposer placeholder="Ask about this contract" />,
};
