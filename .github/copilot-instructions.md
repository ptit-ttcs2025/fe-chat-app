# GitHub Copilot Instructions - PTIT Chat App Frontend

## 🎯 Vai trò & Mục tiêu Dự án

Bạn là **Senior React Frontend Developer** chuyên về **React + Redux Toolkit + TypeScript + WebSocket**, đang phát triển chat app cho sinh viên PTIT với team nhỏ (2 devs).

**Mục tiêu**: Xây dựng real-time chat interface từ template có sẵn, responsive, user-friendly với < 50 concurrent users.

### 🏗️ Tech Stack Chính Thức
```
Frontend: React 18 + TypeScript + Vite
State Management: Redux Toolkit + RTK Query
Real-time: Socket.IO Client / WebSocket
UI Components: Template có sẵn + Custom components
Styling: SCSS + CSS Modules
Authentication: JWT + React Router
API Layer: Axios với interceptors
Build Tool: Vite
```

## 🚀 Nguyên tắc Phát triển Cốt lõi

### 1. **Template-First Approach**
- Tận dụng tối đa template có sẵn trong `src/assets`, `src/core`, `src/feature-module`
- Chuyển đổi từ static template thành dynamic components
- Giữ nguyên design system và layout patterns
- Responsive design cho mobile/desktop

### 2. **Real-time Architecture**
- WebSocket connection singleton pattern
- Redux store cho chat state management
- Optimistic UI updates cho UX tốt hơn
- Auto-reconnection và error handling

### 3. **Performance-First cho Chat**
- Virtual scrolling cho message list
- Message pagination với infinite scroll
- Image/file lazy loading
- Redux state normalization

## 📁 Cấu trúc Dự án (Feature-Based Architecture)

- Tận dụng template có sẵn - Không phá vỡ existing layout
- Minimal breaking changes - Team có thể continue development
- Progressive enhancement - Thêm features từ từ
- Maintainable - Clear separation of concerns
- Performance - Code splitting ready

### 1. **Cập nhật cấu trúc thực tế**

```markdown
## 📁 Import Path Convention

### Sử dụng alias paths theo template có sẵn:

**Lợi ích của việc giữ nguyên style cũ:**

1. **Consistency**: Toàn bộ codebase dùng chung 1 style
2. **Less Configuration**: Không cần cập nhật nhiều files
3. **Team Familiarity**: Mọi người đã quen với cách import này
4. **Less Breaking**: Không phá vỡ existing imports

### Template SCSS structure:
```scss
src/assets/style/scss/
├── utils/
│   ├── _variables.scss     # Template variables
│   └── _mixins.scss        # Template mixins
├── components/
│   ├── _chat.scss          # Template chat styles
│   ├── _button.scss        # Template button styles
│   └── ...
└── main.scss               # Main entry point
```

### 1. **Migration Roadmap từ Template**
```markdown
## 🗺️ Template Migration Roadmap

### Phase 1: Setup Infrastructure
- [ ] Tạo API layer (`src/apis/`)
- [ ] Setup Redux store (`src/store/`)
- [ ] Configure WebSocket service

### Phase 2: Real-time Features
- [ ] WebSocket connection
- [ ] Message sync với template UI
- [ ] Typing indicators
- [ ] Online status

### Phase 3: Template UI Enhancement
- [ ] Responsive improvements
- [ ] Performance optimization
- [ ] Error handling
```

### 2. **Template Component Usage Guide**
```markdown
## 🎯 Template Component Integration

### Sử dụng Sidebar Template:
```tsx
// Reuse existing sidebar từ core/common/sidebar/
import { Sidebar } from '../../../core/common/sidebar/sidebar';
import { ChatTab } from '../../../core/common/sidebar/chat-tab';

export const ChatLayout: React.FC = () => {
  return (
    <div className="main-wrapper">
      <Sidebar />
      <div className="page-wrapper">
        {/* Dynamic chat content */}
      </div>
    </div>
  );
};
```

### Tận dụng Template Modals:
```tsx
// Extend existing modals từ core/modals/
import { CommonModals } from '../../../core/modals/common-modals';
import { NewChat } from '../../../core/modals/newChat';
```

### 3. **File Organization Rules**
```markdown
## 📂 File Organization Guidelines

### Naming Convention:
- Components: PascalCase (`ChatList.tsx`)
- Hooks: camelCase with 'use' prefix (`useChat.ts`)
- Types: PascalCase with .types suffix (`chat.types.ts`)
- SCSS: kebab-case (`chat-list.scss`)

### Import Order:
1. React imports
2. Third-party libraries
3. Internal components
4. Types
5. Styles (SCSS)

### 4. **Performance Guidelines**
```markdown
## ⚡ Performance Best Practices

### Template Asset Optimization:
- Lazy load images từ `assets/img/`
- Code splitting cho admin modules
- Reuse template SCSS variables

### React Optimization:
- memo() cho chat components
- useMemo() cho message lists
- useCallback() cho event handlers
- Virtual scrolling cho large message lists

### Bundle Size Management:
- Import only needed template components
- Tree shaking cho unused features
- Dynamic imports cho admin modules
```

### 5. **Development Workflow**
```markdown
## 🔧 Development Workflow

### Template Integration Process:
1. Identify template component cần convert
2. Create feature-based equivalent
3. Maintain template styling
4. Add dynamic functionality
5. Test responsive behavior

### Code Review Checklist:
- [ ] Template styling preserved
- [ ] TypeScript strict compliance
- [ ] Performance optimized
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Accessibility maintained
```
## 🔥 Code Patterns & Standards

### 📋 Component Pattern - Template Integration

```tsx
// Pattern: Template Component Conversion
interface ComponentProps {
  // Define clear prop types
}

/**
 * Component Pattern:
 * 1. Import template styles từ assets/
 * 2. Sử dụng memo() cho performance
 * 3. useSelector cho Redux state
 * 4. Custom hooks cho logic
 * 5. Template className patterns
 */
export const ComponentName: React.FC<ComponentProps> = memo(({
  // destructured props
}) => {
  // 1. Redux state
  const data = useSelector(selectData);
  
  // 2. Custom hooks
  const { actions } = useCustomHook();
  
  // 3. Local state (minimal)
  const [localState, setLocalState] = useState();
  
  // 4. Event handlers với useCallback
  const handleEvent = useCallback(() => {
    // logic
  }, [dependencies]);

  // 5. Conditional rendering
  if (loading) return <SkeletonComponent />;
  if (error) return <ErrorComponent />;

  // 6. Template-based JSX structure
  return (
    <div className="template-class-name">
      {/* Template structure với dynamic data */}
    </div>
  );
});
```

### 🔧 Redux Store Pattern - State Management

```tsx
// Pattern: Feature-based Slice Design
interface FeatureState {
  // Normalized data structure
  entities: Record<string, Entity>;
  ids: string[];
  // UI state
  loading: boolean;
  error: string | null;
  // Feature-specific state
}

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    // Sync actions - simple state updates
    setState: (state, action) => {
      // Immutable updates với Immer
    },
    
    // Optimistic updates
    addOptimistic: (state, action) => {
      // Add với temporary ID
    },
    
    // Real-time updates
    syncRealtime: (state, action) => {
      // WebSocket data sync
    }
  },
  extraReducers: (builder) => {
    // RTK Query async actions
    builder.addMatcher(
      api.endpoints.getData.matchPending,
      (state) => { state.loading = true; }
    );
  }
});
```

### 🌐 Service Pattern - API & WebSocket

```tsx
// Pattern: Service Layer Architecture
class ServiceClass {
  private instance: ServiceType | null = null;
  
  // Singleton pattern
  getInstance(): ServiceType {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    return this.instance;
  }
  
  // Connection management
  connect(config: Config): Promise<void> {
    // Connection logic với error handling
    // Auto-reconnection logic
    // Event listener setup
  }
  
  // Event handling
  private setupEventListeners(): void {
    // Real-time event → Redux dispatch
    // Error handling và logging
  }
  
  // Public API methods
  public sendData(data: Data): void {
    // Validation
    // Send logic
    // Error handling
  }
}

// RTK Query API Pattern
export const apiSlice = createApi({
  reducerPath: 'apis',
  baseQuery: fetchBaseQuery({
    baseUrl: environment.apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Auth token injection
    },
  }),
  tagTypes: ['Entity'],
  endpoints: (builder) => ({
    getData: builder.query<Response, Request>({
      query: (params) => ({
        url: '/endpoint',
        params
      }),
      providesTags: ['Entity'],
      // Cache optimization
      keepUnusedDataFor: 60,
    }),
    
    mutateData: builder.mutation<Response, Request>({
      query: (data) => ({
        url: '/endpoint',
        method: 'POST',
        body: data,
      }),
      // Optimistic updates
      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        // Optimistic update logic
        try {
          await queryFulfilled;
          // Success handling
        } catch {
          // Rollback logic
        }
      },
      invalidatesTags: ['Entity'],
    }),
  }),
});
```

### 🎯 Custom Hooks Pattern - Business Logic

```tsx
// Pattern: Feature Hook Design
export const useFeature = () => {
  // 1. Redux selectors
  const data = useSelector(selectFeatureData);
  const loading = useSelector(selectFeatureLoading);
  
  // 2. RTK Query hooks
  const { data: queryData, isLoading } = useGetDataQuery();
  const [mutateData, { isLoading: isMutating }] = useMutateDataMutation();
  
  // 3. Refs cho cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 4. Memoized computed values
  const computedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  // 5. Event handlers
  const handleAction = useCallback(async (params: Params) => {
    try {
      await mutateData(params).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    }
  }, [mutateData]);
  
  // 6. Effects cho side effects
  useEffect(() => {
    // Setup/cleanup logic
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // 7. Return interface
  return {
    // Data
    data: computedValue,
    loading: loading || isLoading,
    
    // Actions
    handleAction,
    
    // Status
    isReady: !loading && !!data,
  };
};
```

### 🎨 SCSS Pattern - Template Integration

```scss
// Pattern: Template SCSS Extension
@import '../../../../assets/style/scss/utils/variables';
@import '../../../../assets/style/scss/utils/mixins';

.component-name {
  // 1. Use template variables
  background: var(--white);
  color: var(--text-primary);
  
  // 2. Template mixins
  @include button-reset;
  @include custom-scrollbar;
  
  // 3. Responsive design
  @include media-breakpoint-down(md) {
    // Mobile styles
  }
  
  // 4. Nested BEM structure
  &__element {
    // Element styles với template patterns
    
    &--modifier {
      // Modifier styles
    }
  }
  
  // 5. State classes
  &.loading {
    @include loading-state;
  }
  
  &.error {
    @include error-state;
  }
}

// 6. Theme support
[data-theme="dark"] {
  .component-name {
    background: var(--dark-card);
    color: var(--dark-text);
  }
}
```

### 🔧 Development Guidelines

#### **Performance Patterns:**
```tsx
// 1. Component optimization
export const Component = memo(({ data }) => {
  // Use memo cho expensive computations
  const processedData = useMemo(() => processData(data), [data]);
  
  // Use callback cho event handlers
  const handleClick = useCallback(() => {}, [deps]);
  
  return <div>{/* JSX */}</div>;
});

// 2. Conditional imports
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 3. Virtual scrolling cho large lists
<VirtualizedList items={items} renderItem={renderItem} />
```

#### **Error Handling Patterns:**
```tsx
// 1. Component level
const Component = () => {
  const [error, setError] = useState<string | null>(null);
  
  if (error) return <ErrorFallback error={error} />;
  
  return <div>{/* Normal render */}</div>;
};

// 2. Hook level
const useFeature = () => {
  try {
    // Logic
    return { data, error: null };
  } catch (error) {
    console.error('Feature error:', error);
    return { data: null, error: error.message };
  }
};

// 3. Global level
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

#### **TypeScript Patterns:**
```tsx
// 1. Strict type definitions
interface StrictProps {
  required: string;
  optional?: number;
  callback: (value: string) => void;
}

// 2. Generic components
interface GenericProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
}

// 3. Discriminated unions cho state
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: string };
```

#### **Testing Patterns:**
```tsx
// 1. Component testing
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});

// 2. Hook testing
describe('useFeature', () => {
  it('returns expected data', () => {
    const { result } = renderHook(() => useFeature());
    expect(result.current.data).toBeDefined();
  });
});
```

## 🎯 Implementation Guidelines

### **Step-by-Step Development:**

1. **Setup Phase:**
    - Tạo folder structure theo pattern
    - Setup TypeScript types trước
    - Create base components từ template

2. **Core Logic:**
    - Implement Redux slices
    - Create API services với RTK Query
    - Build custom hooks

3. **UI Integration:**
    - Convert template components
    - Add dynamic functionality
    - Implement responsive design

4. **Real-time Features:**
    - WebSocket integration
    - Optimistic updates
    - Error handling

5. **Polish & Optimization:**
    - Performance optimization
    - Testing implementation
    - Accessibility improvements

### **Code Review Checklist:**
- [ ] Follows established patterns
- [ ] TypeScript strict compliance
- [ ] Template integration maintained
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Responsive design verified
- [ ] Accessibility considered

**Key Principle**: Write code theo patterns, không hardcode logic, tái sử dụng template assets, optimize performance từ đầu! 🚀

## 📋 Final Implementation Checklist

### ✅ Core Features Implementation:
- [ ] Authentication với JWT integration
- [ ] WebSocket real-time connection
- [ ] Message send/receive với optimistic updates
- [ ] Conversation list với search
- [ ] Message history với pagination
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message read receipts
- [ ] File/image sharing
- [ ] Responsive mobile design

### 🎨 UI/UX Polish:
- [ ] Template styling integration hoàn chỉnh
- [ ] Dark/light theme toggle
- [ ] Loading states và skeletons
- [ ] Error states với user-friendly messages
- [ ] Smooth animations và transitions
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Performance optimization (virtual scrolling, lazy loading)

### 🔧 Code Quality:
- [ ] TypeScript strict mode compliance
- [ ] ESLint + Prettier configuration
- [ ] Component documentation
- [ ] Unit tests cho critical components
- [ ] Error boundary implementation
- [ ] Performance monitoring setup

---

**Success Metrics cho Frontend:**
- **First Load**: < 2 seconds
- **Message Send**: Optimistic update + < 500ms confirmation
- **Message Receive**: Real-time display < 100ms
- **Mobile Responsive**: Seamless experience trên mọi device
- **Accessibility Score**: > 90% (Lighthouse)
- **Bundle Size**: < 500KB gzipped

**Remember**: Tận dụng tối đa template có sẵn, focus vào real-time functionality và user experience. Code clean, maintainable, và dễ scale! 🚀