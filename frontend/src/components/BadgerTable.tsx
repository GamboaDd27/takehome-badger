import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { CsvResult } from '../types';

interface BadgerTableProps {
  searchTerm: string;
  refreshTrigger: number;
}

const BadgerTable: React.FC<BadgerTableProps> = ({ searchTerm, refreshTrigger }) => {
  const [data, setData] = useState<CsvResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data for development
  const generateMockData = (): CsvResult[] => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      stock_code: `PART-${String(i + 1001).padStart(4, '0')}`,
      number_quotes_found: Math.floor(Math.random() * 20),
      total_price: parseFloat((Math.random() * 10000).toFixed(2)),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/results/?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm || ''}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        setTotalPages(result.totalPages || 1);
      } else {
        // Use mock data on error
        const mockData = generateMockData();
        const filtered = searchTerm 
          ? mockData.filter(item => 
              item.stock_code.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : mockData;
        
        setData(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data on error
      const mockData = generateMockData();
      const filtered = searchTerm 
        ? mockData.filter(item => 
            item.stock_code.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockData;
      
      setData(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No results found</p>
        {searchTerm && (
          <p className="text-gray-400 mt-2">
            Try adjusting your search criteria
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Code
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number of Quotes Found
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-purple-600">
                    {row.stock_code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {row.number_quotes_found}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                  {formatCurrency(row.total_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatDate(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <div className="text-sm text-gray-500">
          Showing page {currentPage} of {totalPages}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`
                  min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200
                  ${currentPage === pageNum 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgerTable;