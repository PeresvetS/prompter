import React, { useState, useEffect } from 'react';
import { adminAPI, User, UserListResponse } from '../api';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);

  const loadUsers = async (page = 1, searchTerm = search) => {
    setLoading(true);
    setError('');
    try {
      const response: UserListResponse = await adminAPI.getUsers(
        page,
        limit,
        searchTerm,
      );
      // Защита от неправильного ответа API
      setUsers(response.users || []);
      setCurrentPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      // При ошибке оставляем пустой массив, а не undefined
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers(1, search);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
  };

  const handleBanToggle = async (user: User) => {
    try {
      if (user.isBanned) {
        await adminAPI.unbanUser(user.id);
      } else {
        await adminAPI.banUser(user.id);
      }
      loadUsers(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetRequests = async (user: User) => {
    try {
      await adminAPI.resetUserDailyRequests(user.id);
      loadUsers(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset user requests');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px',
        }}
      >
        <h1>Assistant Gate Bot - Admin Panel</h1>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>Total Users</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {total}
          </p>
        </div>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>
            Active Users
          </h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {(users || []).filter((u) => !u.isBanned).length}
          </p>
        </div>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>
            Banned Users
          </h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {(users || []).filter((u) => u.isBanned).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by username, first name, or Telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSearch('');
                setCurrentPage(1);
                loadUsers(1, '');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
          }}
        >
          {error}
        </div>
      )}

      {/* Users Table */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white',
          overflow: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '800px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Telegram ID
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Username
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Daily Requests
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Last Request
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Created
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  No users found
                </td>
              </tr>
            ) : (
              (users || []).map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: user.isBanned ? '#fff5f5' : 'white',
                  }}
                >
                  <td style={{ padding: '12px' }}>{user.id}</td>
                  <td style={{ padding: '12px' }}>{user.telegramId}</td>
                  <td style={{ padding: '12px' }}>{user.username || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(' ') || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>{user.dailyRequests}</td>
                  <td style={{ padding: '12px' }}>
                    {user.lastRequestDate
                      ? formatDate(user.lastRequestDate)
                      : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: user.isBanned ? '#dc3545' : '#28a745',
                        color: 'white',
                      }}
                    >
                      {user.isBanned ? 'BANNED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div
                      style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}
                    >
                      <button
                        onClick={() => handleBanToggle(user)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: user.isBanned
                            ? '#28a745'
                            : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        onClick={() => handleResetRequests(user)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
              color: currentPage === 1 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>

          <span style={{ margin: '0 10px' }}>
            Page {currentPage} of {totalPages} ({total} total users)
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              backgroundColor:
                currentPage === totalPages ? '#e9ecef' : '#007bff',
              color: currentPage === totalPages ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
