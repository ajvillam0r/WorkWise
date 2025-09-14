import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ClipboardDocumentListIcon,
    StarIcon,
    BriefcaseIcon,
    ArrowTrendingUpIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function FreelancerDashboard({ overview, monthly_earnings, recent_projects, skills_performance }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
        const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500',
            indigo: 'bg-indigo-500'
        };

        return (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className={`w-8 h-8 ${colorClasses[color]} rounded-full flex items-center justify-center`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <div className="text-sm font-medium text-gray-500">{title}</div>
                            <div className="text-2xl font-bold text-gray-900">{value}</div>
                            {trend && (
                                <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend === 'up' ? (
                                        <ArrowUpIcon className="w-4 h-4 mr-1" />
                                    ) : (
                                        <ArrowDownIcon className="w-4 h-4 mr-1" />
                                    )}
                                    {trendValue}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Analytics Dashboard
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href="/analytics/earnings"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                        >
                            Detailed Reports
                        </Link>
                        <a
                            href="/analytics/export?type=earnings&period=12months&format=pdf"
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                            download
                        >
                            Export PDF
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Analytics Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatCard
                            title="Total Earnings"
                            value={formatCurrency(overview.total_earnings)}
                            icon={CurrencyDollarIcon}
                            color="green"
                        />
                        <StatCard
                            title="Completed Projects"
                            value={overview.completed_projects}
                            icon={ClipboardDocumentListIcon}
                            color="blue"
                        />
                        <StatCard
                            title="Average Rating"
                            value={`${overview.average_rating}/5`}
                            icon={StarIcon}
                            color="yellow"
                        />
                        <StatCard
                            title="Active Projects"
                            value={overview.active_projects}
                            icon={BriefcaseIcon}
                            color="purple"
                        />
                        <StatCard
                            title="Bid Success Rate"
                            value={`${overview.bid_success_rate}%`}
                            icon={ArrowTrendingUpIcon}
                            color="indigo"
                        />
                    </div>

                    {/* Earnings Chart */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthly_earnings}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value) => [formatCurrency(value), 'Earnings']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="earnings" 
                                            stroke="#3B82F6" 
                                            strokeWidth={2}
                                            dot={{ fill: '#3B82F6' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Skills Performance */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Earning Skills</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={skills_performance}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="skill" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip 
                                                formatter={(value) => [formatCurrency(value), 'Earnings']}
                                            />
                                            <Bar dataKey="earnings" fill="#10B981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Recent Projects */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                                    <Link
                                        href="/analytics/projects"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        View All
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {recent_projects.length > 0 ? (
                                        recent_projects.map((project) => (
                                            <div key={project.id} className="border-l-4 border-blue-500 pl-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {project.job?.title || 'Untitled Project'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            Client: {project.client?.first_name} {project.client?.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Status: <span className="capitalize">{project.status}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900">
                                                            {formatCurrency(project.agreed_amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(project.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No recent projects</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Link
                                    href="/analytics/earnings"
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <CurrencyDollarIcon className="w-8 h-8 text-green-500 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Earnings Report</p>
                                        <p className="text-sm text-gray-600">Detailed earnings analysis</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    href="/analytics/projects"
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ClipboardDocumentListIcon className="w-8 h-8 text-blue-500 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Projects Report</p>
                                        <p className="text-sm text-gray-600">Project performance metrics</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    href="/analytics/performance"
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ChartBarIcon className="w-8 h-8 text-purple-500 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Performance</p>
                                        <p className="text-sm text-gray-600">Detailed performance analysis</p>
                                    </div>
                                </Link>
                                
                                <a
                                    href="/analytics/export?type=projects&period=12months&format=pdf"
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    download
                                >
                                    <ArrowTrendingUpIcon className="w-8 h-8 text-indigo-500 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Export PDF</p>
                                        <p className="text-sm text-gray-600">Download reports</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
