'use client';
import * as React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Icon,
  PinInput,
  Progress,
  SignaturePad,
  Slider,
  Sparkline,
  StatCard,
  Switch,
  ThemeSwitcher,
  toast,
} from '@bindshq/stance-react';
import type { DataTableColumn } from '@bindshq/stance-react';
import { LandingShowcase } from './landing-showcase';

interface Member {
  id: string;
  name: string;
  team: string;
  status: 'Live' | 'Pending' | 'Failed';
}

const members: Member[] = [
  { id: '1', name: 'Priya Nair', team: 'Sales', status: 'Live' },
  { id: '2', name: 'Lukas Brenner', team: 'Legal', status: 'Pending' },
  { id: '3', name: 'Hana Sato', team: 'Finance', status: 'Live' },
  { id: '4', name: 'Tomás Ruiz', team: 'Operations', status: 'Failed' },
];

const tone = { Live: 'success', Pending: 'warning', Failed: 'danger' } as const;

const columns: DataTableColumn<Member>[] = [
  {
    id: 'name',
    header: 'Member',
    accessor: 'name',
    sortable: true,
    cell: (m) => (
      <span className="bento__member">
        <Avatar name={m.name} size="xs" />
        {m.name}
      </span>
    ),
  },
  { id: 'team', header: 'Team', accessor: 'team', sortable: true },
  {
    id: 'status',
    header: 'Signature',
    accessor: 'status',
    cell: (m) => <Badge tone={tone[m.status]}>{m.status}</Badge>,
  },
];

/** A wall of live Stance components. Everything here is the real library, not a picture. */
export function LandingBento() {
  const [rollout, setRollout] = React.useState(72);
  return (
    <div className="bento">
      <div className="bento__tile">
        <LandingShowcase compact />
      </div>

      <StatCard
        className="bento__tile"
        label="Signatures deployed"
        value="1,942"
        delta="12%"
        trend="up"
        comparison="from last month"
        chart={
          <Sparkline
            data={[12, 18, 15, 22, 27, 25, 34, 38]}
            label="Deployments over eight weeks"
            area
          />
        }
      />
      <StatCard
        className="bento__tile"
        label="Failed deliveries"
        value="7"
        delta="31%"
        trend="down"
        invert
        comparison="from last month"
        chart={<Sparkline data={[19, 16, 17, 12, 13, 9, 8, 7]} label="Failures over eight weeks" />}
      />

      <Card className="bento__tile bento__tile--center">
        <CardContent>
          <Calendar
            aria-label="Rollout date"
            defaultValue={new Date(2026, 10, 18)}
            today={new Date(2026, 10, 11)}
          />
        </CardContent>
      </Card>

      <Card className="bento__tile">
        <CardContent>
          <DataTable
            columns={columns}
            data={members}
            getRowId={(m) => m.id}
            caption="Organisation users"
            density="compact"
          />
        </CardContent>
      </Card>

      <Card className="bento__tile">
        <CardHeader>
          <CardTitle>Sign here</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad label="Signature" height={130} />
        </CardContent>
      </Card>

      <Card className="bento__tile">
        <CardHeader>
          <CardTitle>Verification code</CardTitle>
        </CardHeader>
        <CardContent className="bento__stack">
          <PinInput length={6} defaultValue="204" aria-label="Verification code" />
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Icon name="bell" />}
            onClick={() =>
              toast.success('Code sent', { description: 'Check your inbox for a new code.' })
            }
          >
            Resend code
          </Button>
        </CardContent>
      </Card>

      <Card className="bento__tile">
        <CardHeader>
          <CardTitle>Rollout</CardTitle>
        </CardHeader>
        <CardContent className="bento__stack">
          <Progress value={rollout} label="Mailboxes updated" showValue />
          <Slider aria-label="Rollout percentage" value={rollout} onValueChange={setRollout} />
          <Switch defaultChecked label="Notify admins when complete" />
        </CardContent>
      </Card>

      <Card className="bento__tile">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="bento__stack">
          <ThemeSwitcher label="Site theme" />
          <div className="bento__row">
            <Badge tone="success">Live</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Failed</Badge>
            <Badge tone="neutral" variant="outline">
              Draft
            </Badge>
          </div>
          <div className="bento__row">
            <Button size="sm">Deploy</Button>
            <Button size="sm" variant="secondary">
              Preview
            </Button>
            <Button size="sm" variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
