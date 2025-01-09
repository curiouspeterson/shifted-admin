export default function Dashboard() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-indigo-900 mb-2">Current Schedule</h2>
          <p className="text-indigo-600">View your upcoming shifts and schedule</p>
          <a href="/dashboard/schedules" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500">
            View Schedule →
          </a>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-green-900 mb-2">Team Members</h2>
          <p className="text-green-600">Manage your team and their schedules</p>
          <a href="/dashboard/employees" className="mt-4 inline-block text-sm text-green-600 hover:text-green-500">
            View Team →
          </a>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-purple-900 mb-2">Time-off Requests</h2>
          <p className="text-purple-600">Review and manage time-off requests</p>
          <a href="/dashboard/requests" className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-500">
            View Requests →
          </a>
        </div>
      </div>
    </div>
  )
} 