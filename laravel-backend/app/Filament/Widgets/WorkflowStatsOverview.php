<?php

namespace App\Filament\Widgets;

use App\Models\Flow;
use App\Models\FlowNode;
use App\Models\FlowEdge;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class WorkflowStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = '30s';

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        // Flow stats
        $totalFlows = Flow::count();
        $activeFlows = Flow::where('status', Flow::STATUS_ACTIVE)->count();
        $draftFlows = Flow::where('status', Flow::STATUS_DRAFT)->count();
        $templateFlows = Flow::where('is_template', true)->count();

        // Nodes & Edges
        $totalNodes = FlowNode::count();
        $totalEdges = FlowEdge::count();

        // Flows created this week
        $flowsThisWeek = Flow::where('created_at', '>=', now()->startOfWeek())->count();

        // Average nodes per flow
        $avgNodesPerFlow = $totalFlows > 0 ? round($totalNodes / $totalFlows, 1) : 0;

        return [
            Stat::make('Tổng Workflows', $totalFlows)
                ->description("{$activeFlows} đang active, {$draftFlows} draft")
                ->icon('heroicon-o-arrows-right-left')
                ->color('primary'),

            Stat::make('Templates', $templateFlows)
                ->description('Workflow mẫu')
                ->icon('heroicon-o-document-duplicate')
                ->color('info'),

            Stat::make('Nodes', $totalNodes)
                ->description("~{$avgNodesPerFlow} nodes/flow")
                ->icon('heroicon-o-squares-2x2')
                ->color('warning'),

            Stat::make('Tuần Này', $flowsThisWeek)
                ->description('Flows mới tạo')
                ->icon('heroicon-o-calendar')
                ->color($flowsThisWeek > 0 ? 'success' : 'gray')
                ->chart($this->getWeeklyChart()),
        ];
    }

    protected function getWeeklyChart(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = Flow::whereDate('created_at', $date->toDateString())->count();
            $data[] = $count;
        }
        return $data;
    }
}
