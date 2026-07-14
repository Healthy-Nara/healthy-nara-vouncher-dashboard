import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  getNADutyStatus, startNADuty, finishNADuty, getNAReports,
  fetchBookings, changeNAPassword, createNAReport
} from '../../api';
import { 
  Play, Square, Clock, FileText, History, LogOut, 
  ChevronRight, Calendar, User, Loader2, CheckCircle2, Key, Plus
} from 'lucide-react';

const NADashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [naUser, setNaUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [childName, setChildName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('na_user');
    if (stored) {
      setNaUser(JSON.parse(stored));
    }
  }, []);

  const { data: dutyStatus, isLoading: dutyLoading } = useQuery({
    queryKey: ['naDutyStatus'],
    queryFn: getNADutyStatus,
  });

  const { data: todayReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['naReports', new Date().toISOString().split('T')[0]],
    queryFn: () => getNAReports({ date: new Date().toISOString().split('T')[0] }),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['naBookings'],
    queryFn: () => fetchBookings('Assigned'),
  });

  const startDutyMutation = useMutation({
    mutationFn: startNADuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['naDutyStatus'] });
    },
  });

  const finishDutyMutation = useMutation({
    mutationFn: finishNADuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['naDutyStatus'] });
      queryClient.invalidateQueries({ queryKey: ['naReports'] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changeNAPassword,
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || 'Password ပြောင်း၍ မရပါ');
    },
  });

  const createReportMutation = useMutation({
    mutationFn: createNAReport,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['naReports'] });
      setShowCreateModal(false);
      setSelectedBooking('');
      setChildName('');
      if (data?._id) {
        navigate(`/na/report/${data._id}`);
      }
    },
  });

  const handlePasswordChange = () => {
    setPasswordError('');
    
    if (!currentPassword || !newPassword) {
      setPasswordError('Password အားလုံး ဖြည့်ပါ');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password အနည်းဆုံး ၆ လုံး ထည့်ပါ');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Password အသစ် နှစ်ခု တူညီရပါမည်');
      return;
    }
    
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleCreateReport = () => {
    if (!selectedBooking || !childName) return;
    
    createReportMutation.mutate({
      bookingId: selectedBooking,
      date: new Date().toISOString(),
      childName,
      status: 'draft'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('na_token');
    localStorage.removeItem('na_user');
    navigate('/na/login');
  };

  const activeDuty = dutyStatus?.activeDuty;
  const reports = todayReports || [];
  const assignedBookings = bookingsData?.filter((b: any) => 
    b.caregiverName === naUser?.name
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-primary/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <User className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{naUser?.name || 'NA'}</p>
              <p className="text-xs text-gray-500">Nurse Aid</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Password ပြောင်းရန်"
            >
              <Key size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Duty Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">အလုပ်ချိန်</h2>
          
          {dutyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : activeDuty ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Clock size={18} />
                  <span className="font-semibold">အလုပ်လုပ်နေဆဲ</span>
                </div>
                <p className="text-sm text-green-600">
                  စတင်ချိန်: {new Date(activeDuty.dutyStart).toLocaleTimeString('my-MM')}
                </p>
                {activeDuty.booking && (
                  <p className="text-sm text-green-600 mt-1">
                    Booking: {activeDuty.booking.bookingNumber}
                  </p>
                )}
              </div>
              <button
                onClick={() => finishDutyMutation.mutate(activeDuty._id)}
                disabled={finishDutyMutation.isPending}
                className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {finishDutyMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Square size={20} />
                )}
                အလုပ်ပြီးဆုံးမည်
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
                အလုပ်မစတွေ့သေးပါ
              </div>
              {assignedBookings.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Booking ရွေးပါ:</p>
                  {assignedBookings.map((booking: any) => (
                    <button
                      key={booking._id}
                      onClick={() => startDutyMutation.mutate(booking._id)}
                      disabled={startDutyMutation.isPending}
                      className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {startDutyMutation.isPending ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                      {booking.bookingNumber} - အလုပ်စတင်မည်
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Assign ထားသည့် Booking မရှိပါ
                </p>
              )}
            </div>
          )}
        </div>

        {/* Today's Reports */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ယနေ့ Report များ</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary-dark transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                Report အသစ်
              </button>
              <button
                onClick={() => navigate('/na/reports')}
                className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
              >
                အားလုံး <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>ယနေ့ Report မရှိသေးပါ</p>
              <p className="text-sm mt-1">အလုပ်စတင်ပြီးနောက် Report ဖြည့်နိုင်ပါသည်</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any) => (
                <button
                  key={report._id}
                  onClick={() => navigate(`/na/report/${report._id}`)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      report.status === 'submitted' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {report.status === 'submitted' ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{report.childName}</p>
                      <p className="text-xs text-gray-500">
                        {report.status === 'submitted' ? 'ပြီးဆုံးပြီ' : 'ဖြည့်ဆဲ'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/na/reports')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10 flex flex-col items-center gap-3 hover:bg-gray-50 transition-all"
          >
            <History className="h-8 w-8 text-primary" />
            <span className="font-semibold text-gray-700">Report မှတ်တမ်း</span>
          </button>
          <button
            onClick={() => navigate('/na/dashboard')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-primary/10 flex flex-col items-center gap-3 hover:bg-gray-50 transition-all"
          >
            <Calendar className="h-8 w-8 text-primary" />
            <span className="font-semibold text-gray-700">ချိန်းဆိုမှု</span>
          </button>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report အသစ်ဖန်တီးရန်</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Booking ရွေးပါ</label>
                <select
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                >
                  <option value="">Booking ရွေးပါ</option>
                  {assignedBookings.map((booking: any) => (
                    <option key={booking._id} value={booking._id}>
                      {booking.bookingNumber} - {booking.customerName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ကလေးအမည်</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  placeholder="ကလေးအမည် ထည့်ပါ"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedBooking('');
                  setChildName('');
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                ပယ်ဖျက်ရန်
              </button>
              <button
                onClick={handleCreateReport}
                disabled={!selectedBooking || !childName || createReportMutation.isPending}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {createReportMutation.isPending ? 'ဖန်တီးနေပါသည်...' : 'ဖန်တီးရန်'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Password ပြောင်းရန်</h3>
            
            {passwordSuccess ? (
              <div className="text-center py-4">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-green-600 h-8 w-8" />
                </div>
                <p className="text-green-600 font-semibold">Password ပြောင်းပြီးပါပြီ!</p>
              </div>
            ) : (
              <>
                {passwordError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">လက်ရှိ Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      placeholder="လက်ရှိ password ထည့်ပါ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password အသစ်</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      placeholder="Password အသစ် ထည့်ပါ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password အသစ် ထပ်မံထည့်ပါ</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      placeholder="Password အသစ် ထပ်မံထည့်ပါ"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    ပယ်ဖျက်ရန်
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordMutation.isPending}
                    className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {passwordMutation.isPending ? 'ပြောင်းနေပါသည်...' : 'ပြောင်းရန်'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NADashboard;
