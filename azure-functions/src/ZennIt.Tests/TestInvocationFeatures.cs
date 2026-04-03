using Microsoft.Azure.Functions.Worker;

namespace ZennIt.Tests;

internal sealed class TestInvocationFeatures : IInvocationFeatures
{
    private readonly Dictionary<Type, object> _features = new();

    public void Set<T>(T instance)
    {
        _features[typeof(T)] = instance!;
    }

    public T? Get<T>()
    {
        if (_features.TryGetValue(typeof(T), out var instance))
        {
            return (T)instance;
        }

        return default;
    }

    public IEnumerator<KeyValuePair<Type, object>> GetEnumerator()
    {
        return _features.GetEnumerator();
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
}
