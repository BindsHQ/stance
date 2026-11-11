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
  Progress,
  SignaturePad,
  Slider,
  Sparkline,
  StatCard,
  Switch,
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
      <div className="bento__tile bento__tile--feature">
        <LandingShowcase compact />
      </div>

      <Card className="bento__tile bento__tile--calendar">
        <CardContent>
          <Calendar
            aria-label="Rollout date"
            defaultValue={new Date(2026, 10, 18)}
            today={new Date(2026, 10, 11)}
          />
        </CardContent>
      </Card>

      <div className="bento__tile bento__tile--stats">
        <StatCard
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
          label="Failed deliveries"
          value="7"
          delta="31%"
          trend="down"
          invert
          comparison="from last month"
          chart={
            <Sparkline data={[19, 16, 17, 12, 13, 9, 8, 7]} label="Failures over eight weeks" />
          }
        />
      </div>

      <Card className="bento__tile bento__tile--table">
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

      <Card className="bento__tile bento__tile--sign">
        <CardHeader>
          <CardTitle>Sign here</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad label="Signature" height={150} />
        </CardContent>
      </Card>

      <Card className="bento__tile bento__tile--side">
        <CardHeader>
          <CardTitle>Rollout</CardTitle>
        </CardHeader>
        <CardContent className="bento__stack">
          <Progress value={rollout} label="Mailboxes updated" showValue />
          <Slider aria-label="Rollout percentage" value={rollout} onValueChange={setRollout} />
          <Switch defaultChecked label="Notify admins" />
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Icon name="bell" />}
            onClick={() =>
              toast.success('Rollout started', {
                description: 'Admins will be notified when it completes.',
              })
            }
          >
            Start rollout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
