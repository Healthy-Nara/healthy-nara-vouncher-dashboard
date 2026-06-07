import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPublicBooking, selectBookingNA } from '../api';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Package, Phone, CheckCircle, Clock, User } from 'lucide-react';
import halogo from '../assets/halogo.png';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PublicBooking = () => {
  const { token } = useParams<{ token: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['public-booking', token],
    queryFn: () => fetchPublicBooking(token!),
    enabled: !!token,
  });

  const selectMutation = useMutation({
    mutationFn: (caregiverId: string) => selectBookingNA(token!, caregiverId),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-sm text-gray-500">This booking link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your Nurse Aid has been assigned successfully. Our team will contact you shortly with further details.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Assigned NA</p>
            <p className="text-sm font-bold text-gray-900">{booking.caregiverName || 'Processing...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <img src={halogo} alt="Healthy Nara" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Healthy Nara</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Booking Confirmation</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Booking Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Booking Details</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Booking #</p>
                <p className="text-sm font-bold text-gray-900">{booking.bookingNumber}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                <Clock size={10} /> Pending Selection
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <User size={10} /> Customer
                </p>
                <p className="text-sm font-semibold text-gray-900">{booking.customerName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {booking.phoneNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <Package size={10} /> Duty Type
                </p>
                <p className="text-sm font-semibold text-gray-900">{booking.dutyType}</p>
                {booking.servicePackage && booking.servicePackage !== 'N/A' && (
                  <p className="text-xs text-gray-500 mt-0.5">{booking.servicePackage}</p>
                )}
              </div>
            </div>

            {booking.requestedDates && booking.requestedDates.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1 mb-2">
                  <Calendar size={10} /> Requested Dates
                </p>
                <div className="flex flex-wrap gap-2">
                  {booking.requestedDates.map((d: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      <Calendar size={10} />
                      {formatDate(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.requirements && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Special Requirements</p>
                <p className="text-xs text-gray-700">{booking.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Select NA Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Select Your Nurse Aid</p>
          </div>
          <div className="p-5">
            {booking.suggestedCaregivers && booking.suggestedCaregivers.length > 0 ? (
              <div className="space-y-3">
                {booking.suggestedCaregivers.map((sg: any) => {
                  const cg = sg.caregiver || {};
                  const isSelected = selectedId === cg._id;
                  return (
                    <div
                      key={cg._id}
                      onClick={() => setSelectedId(cg._id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{cg.caregiverName}</p>
                            {cg.specialization && (
                              <p className="text-[10px] text-gray-500">{cg.specialization}</p>
                            )}
                            {cg.contactNumber && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone size={8} /> {cg.contactNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle size={12} className="text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No caregivers available for selection yet.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        {selectedId && (
          <button
            onClick={() => selectMutation.mutate(selectedId)}
            disabled={selectMutation.isPending}
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {selectMutation.isPending ? 'Submitting...' : 'Confirm Selection'}
          </button>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400">Powered by Healthy Nara</p>
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
