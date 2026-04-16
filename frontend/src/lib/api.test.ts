import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTask, fetchTasks, deleteTask, cancelTask } from './api';

const API_URL = 'http://localhost:3001/api';

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('createTask', () => {
  it('sends POST with description and returns taskId + sseUrl', async () => {
    const payload = { taskId: 'abc-123', sseUrl: '/api/tasks/abc-123/stream' };
    const fetchMock = mockFetchResponse(payload);
    vi.stubGlobal('fetch', fetchMock);

    const result = await createTask('Search for smartphones');

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Search for smartphones' }),
    });
    expect(result).toEqual(payload);
  });

  it('throws on non-ok response with server message', async () => {
    const fetchMock = mockFetchResponse({ message: 'Rate limited' }, 429);
    vi.stubGlobal('fetch', fetchMock);

    await expect(createTask('test')).rejects.toThrow('Rate limited');
  });

  it('throws with fallback message when body has no message', async () => {
    const fetchMock = mockFetchResponse({}, 500);
    vi.stubGlobal('fetch', fetchMock);

    await expect(createTask('test')).rejects.toThrow('Erro ao criar tarefa (500)');
  });
});

describe('fetchTasks', () => {
  it('sends GET with limit and offset params', async () => {
    const payload = { tasks: [], total: 0 };
    const fetchMock = mockFetchResponse(payload);
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchTasks(10, 5);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tasks?limit=10&offset=5`);
    expect(result).toEqual(payload);
  });

  it('uses default limit=20 and offset=0', async () => {
    const fetchMock = mockFetchResponse({ tasks: [], total: 0 });
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks();

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tasks?limit=20&offset=0`);
  });

  it('throws on non-ok response', async () => {
    const fetchMock = mockFetchResponse({}, 500);
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchTasks()).rejects.toThrow('Erro ao buscar tarefas (500)');
  });
});

describe('deleteTask', () => {
  it('sends DELETE to the correct endpoint', async () => {
    const fetchMock = mockFetchResponse(null);
    vi.stubGlobal('fetch', fetchMock);

    await deleteTask('task-42');

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tasks/task-42`, {
      method: 'DELETE',
    });
  });

  it('throws on non-ok response', async () => {
    const fetchMock = mockFetchResponse({}, 404);
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteTask('task-42')).rejects.toThrow('Erro ao deletar tarefa (404)');
  });
});

describe('cancelTask', () => {
  it('sends POST to cancel endpoint', async () => {
    const fetchMock = mockFetchResponse(null);
    vi.stubGlobal('fetch', fetchMock);

    await cancelTask('task-99');

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tasks/task-99/cancel`, {
      method: 'POST',
    });
  });

  it('throws on non-ok response', async () => {
    const fetchMock = mockFetchResponse({}, 500);
    vi.stubGlobal('fetch', fetchMock);

    await expect(cancelTask('task-99')).rejects.toThrow('Failed to cancel task');
  });
});
