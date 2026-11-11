'use client';
import * as React from 'react';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  Icon,
  Input,
  Progress,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bindshq/stance-react';

/** A realistic product composition built entirely from Stance components. */
export function LandingShowcase({ compact = false }: { compact?: boolean }) {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <Card variant="elevated" className="showcase-card">
      <CardHeader>
        <div className="showcase-card__head">
          <div>
            <CardTitle>Sales team signature</CardTitle>
            <CardDescription>Deployed to 48 organisation users</CardDescription>
          </div>
          <Badge tone="success" variant="soft">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList aria-label="Template sections">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rollout">Rollout</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div className="showcase-card__fields">
              <FormField label="Template name">
                <Input defaultValue="Sales team signature" />
              </FormField>
              {!compact && (
                <FormField label="Reply-to domain" description="Used for every signature link.">
                  <Input defaultValue="binds.si" prefix={<Icon name="globe" />} />
                </FormField>
              )}
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                label="Apply to new members automatically"
              />
            </div>
          </TabsContent>
          <TabsContent value="rollout">
            <div className="showcase-card__fields">
              <Progress value={72} label="Rollout" showValue />
              <p className="showcase-card__note">
                35 of 48 mailboxes updated through Exchange relay.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <AvatarGroup max={4} size="sm">
          <Avatar name="Amara Okafor" />
          <Avatar name="Lukas Brenner" />
          <Avatar name="Priya Nair" />
          <Avatar name="Tomás Ruiz" />
          <Avatar name="Hana Sato" />
          <Avatar name="Owen Price" />
        </AvatarGroup>
        <div className="showcase-card__actions">
          <Button variant="ghost" size="sm">
            Preview
          </Button>
          <Button size="sm" leadingIcon={<Icon name="send" />}>
            Deploy
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
