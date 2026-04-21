import { useQuery } from '@tanstack/react-query';
import { fetchCaregivers } from '../api';
import { useState } from 'react';
import { UserCheck, Phone, MapPin, Search, User } from 'lucide-react';

const Caregivers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: caregivers, isLoading } = useQuery({
    queryKey: ['caregivers'],
    queryFn: fetchCaregivers,
  });

  const filteredCaregivers = caregivers?.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.township?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Caregiver Directory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your network of professional caregivers.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search caregivers..."
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 focus:ring-primary focus:border-primary sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading caregivers...</div>
          ) : filteredCaregivers?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No caregivers found.</div>
          ) : (
            filteredCaregivers?.map((caregiver: any) => (
              <div key={caregiver._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 flex gap-2 z-20">
                  <UserCheck size={64} className="opacity-10 group-hover:opacity-20 transition-opacity" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{caregiver.name}</h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Phone size={14} className="text-primary" />
                    <span>{caregiver.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <User size={14} className="text-primary" />
                    <span className="capitalize">{caregiver.gender || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <MapPin size={14} className="text-primary" />
                    <span>{caregiver.township || 'N/A'}</span>
                  </div>
                  {caregiver.address && (
                    <div className="flex items-start text-sm text-gray-600 gap-2">
                      <MapPin size={14} className="text-primary mt-1" />
                      <span>{caregiver.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Caregivers;
